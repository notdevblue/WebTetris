const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const { Query, Pool } = require('./DB.js');
const State = require("./State.js");


const app = new express(); //익스프레스 웹서버 열고
const server = http.createServer(app); //웹서버에 익스프레스 붙여주고
const io = socketio(server); //해당 서버에 소켓도 붙여주고

app.use(express.static('public'));

app.get('/', (req, res) => {
    //어떤 요청이 오건간에 index.html을 보낸다.
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

let roomList = [
    //{name:'', roomName:1, number:1}
];

io.on("connect", socket => {
    console.log(`서버에 새로운 소켓이 착륙했어요 : ${socket.id}`);
    socket.state = State.IN_LOGIN;

    socket.on("disconnecting", async() => {
        console.log(`${socket.id}님이 떠나셨어요`);

        //접속을 끊었을 때는 현재 게임상태가 아니라면 처리할 게 없어
        if (socket.state === State.IN_GAME || socket.state === State.IN_PLAYING) {
            let rooms = [...socket.rooms];
            let targetRoom = rooms.find(x => x !== socket.id);
            let idx = roomList.findIndex(x => x.roomName === targetRoom);
            roomList[idx].number--;
            if (roomList[idx].number <= 0) { //모두가 다 나갔다면 방을 삭제
                roomList.splice(idx, 1); //해당방을 제거
            } else if (socket.state === State.IN_GAME) { //그렇지 않다면 상대방에게 메세지 전송
                io.to(roomList[idx].roomName).emit("leave-player", { isAdmin: true });
            } else if (socket.state === State.IN_PLAYING) {
                io.to(roomList[idx].roomName).emit("leave-player", { isAdmin: false });
                //여기는 승패에 따른 데이터베이스 작업

                recordMatchData(socket, roomList[idx].roomName);
            }
        }

    });

    socket.on("login-process", async data => {
        const { email, pw } = data;
        let sql = "SELECT * FROM users WHERE email = ? AND password = PASSWORD(?)";
        let result = await Query(sql, [email, pw]);
        if (result.length !== 1) {
            socket.emit("login-response", { status: false, msg: "로그인 실패" });
            return;
        }

        // let connectList = [... await io.allSockets()]; //모든 소켓의 id를 알아내고
        // for(let i = 0; i < connectList.length; i++){
        //     if(io.sockets.get(connectList[i]).loginUser !== undefined 
        //         && io.sockets.get(connectList[i]).loginUser.email === result[0].email) {
        //         socket.emit("bad-access", {msg:"중복 로그인"});
        //         return;
        //     }
        // }

        socket.emit("login-response", { status: true, msg: "로그인 성공", roomList });
        socket.loginUser = result[0]; //로그인된 유저를 socket 데이터에 넣어준다.
        socket.state = State.IN_LOBBY;
    });

    //회원가입 요청이 들어왔을 때 
    socket.on("register-request", async data => {
        const { email, name, pw, pwc } = data;

        if (email.trim() === "" || name.trim() === "" || pw.trim() === "" || pw !== pwc) {
            socket.emit(
                "register-response", { status: false, msg: "비어있거나 비밀번호 확인이 올바르지 않습니다" });
            return;
        }

        let sql = "SELECT * FROM users WHERE email = ?";
        let result = await Query(sql, [email]);

        if (result.length != 0) {
            socket.emit("register-response", { status: false, msg: "이미 존재하는 회원입니다." });
            return;
        }

        sql = `INSERT INTO users(email, name, password) VALUES (?, ?, PASSWORD(?))`;
        result = await Query(sql, [email, name, pw]);

        if (result.affectedRows == 1) {
            socket.emit("register-response", { status: true, msg: "정상적으로 회원가입 되었습니다." });
        } else {
            socket.emit("register-response", { status: false, msg: "데이터베이스 처리중 오류 발생" });
        }
        return;
    });

    socket.on("create-room", data => {
        if (socket.state !== State.IN_LOBBY) {
            socket.emit("bad-access", { msg: "잘못된 접근입니다." });
            return;
        }

        const { name } = data; //방이름 뽑아오고
        const roomName = roomList.length < 1 ? 1 : Math.max(...roomList.map(x => x.roomName)) + 1; //룸 번호만 뽑힐꺼고
        //별도의 방리스트
        roomList.push({ name, roomName, number: 1 });
        socket.join(roomName); //해당 소켓을 해당 룸으로 진입시킴

        socket.state = State.IN_GAME;
        socket.emit("enter-room");
    });

    socket.on("join-room", data => {
        if (socket.state !== State.IN_LOBBY) {
            socket.emit("bad-access", { msg: "잘못된 접근입니다." });
            return;
        }
        const { roomName } = data;
        let targetRoom = roomList.find(x => x.roomName === roomName); //해당하는 방이 있는지 찾고
        //존재하지 않는 방이거나 이미 2명이 들어가 있는 방에 들어가려 한다면
        if (targetRoom === undefined || targetRoom.number >= 2) {
            socket.emit("bad-access", { msg: "들어갈 수 없는 방입니다." });
            return;
        }

        socket.join(roomName); //해당 게임 방에 조인

        socket.emit("join-room");
        socket.state = State.IN_GAME;
        targetRoom.number++; //해당 방의 인원을 하나 증가시킴
    });

    socket.on("game-start", data => {

        if (socket.state !== State.IN_GAME) {
            socket.emit("bad-access", { msg: "잘못된 접근입니다." });
            return;
        }

        let socketRooms = [...socket.rooms];
        let room = socketRooms.find(x => x != socket.id); //자기 소켓방이 아닌 다른방

        let targetRoom = roomList.find(x => x.roomName === room);
        if (targetRoom === undefined || targetRoom.number < 2) {
            socket.emit("bad-access", { msg: "시작할 수 없는 상태입니다." });
            return;
        }
        io.to(room).emit("game-start");
    });

    socket.on("in-playing", data => {
        socket.state = State.IN_PLAYING;
    });

    socket.on("game-data", data => {
        if (socket.state !== State.IN_PLAYING) {
            socket.emit("bad-access", { msg: "잘못된 접근입니다." });
            return;
        }

        let room = findRoom(socket);
        //이정보는 누가 받아야할까?
        data.sender = socket.id; //누가보냈는지 기록하고
        socket.broadcast.to(room).emit("game-data", data);
    });

    socket.on("remove-line", data => {
        if (socket.state !== State.IN_PLAYING) {
            socket.emit("bad-access", { msg: "잘못된 접근입니다." });
            return;
        }

        let room = findRoom(socket);
        data.sender = socket.id; //누가보냈는지 기록하고
        socket.broadcast.to(room).emit("remove-line", data);
    });

    socket.on("game-lose", data => {
        let room = findRoom(socket);
        recordMatchData(socket, room);
        //다중 게임이라면 여기서 해당 방에 있는 모든 유저가 전부 패배했는지를 체크해야한다.
        socket.broadcast.to(room).emit("game-win");
    });

    socket.on("goto-lobby", data => {
        socket.state = State.IN_LOBBY; //로비상태로 전환하고
        let room = findRoom(socket);
        let idx = roomList.findIndex(x => x.roomName === room);
        roomList[idx].number--; //한명 감소
        if (roomList[idx].number <= 0) {
            roomList.splice(idx, 1); //해당 방 삭제
        }
        //게임이 완료된 후에 한명이 나가도 방이 한명이 빈것처럼 나와.
    });

    //현재 존재하는 방정보 보내기
    socket.on("room-list", data => {
        socket.emit("room-list", { roomList });
    });

    socket.on("rank-list", async() => {
        let result = await Query("SELECT id, name FROM users");

        for (let i = 0; i < result.length; ++i) {
            let win = await Query(`SELECT users.email, COUNT(*) AS cnt FROM matchesData, users
                            WHERE ((matchesData.host_id = users.id AND matchesData.result = 1)
                            OR (matchesData.client_id = users.id AND matchesData.result = 0))
                            AND users.id = ?`, [result[i].id]);
            result[i].win = win[0].cnt;

            let lose = await Query(`SELECT users.email, COUNT(*) AS cnt FROM matchesData, users
                            WHERE ((matchesData.host_id = users.id AND matchesData.result = 1)
                            OR (matchesData.client_id = users.id AND matchesData.result = 0))
                            AND users.id = ?`, [result[i].id]);
            result[i].lose = lose[0].cnt;
        }

        result.sort((a, b) => (b.win - b.lose) - (a.win - a.lose));
        console.log(result);

        socket.emit("rank-list", { result });
    });
});

function findRoom(socket) {
    let socketRooms = [...socket.rooms]; //해당 소켓이 참여하고 있는 모든 룸을 가져온다.
    let room = socketRooms.find(x => x != socket.id);
    return room;
}

async function recordMatchData(depeatSocket, roomName) {
    let sql = `INSERT INTO matches (result, host_id, client_id, host_score, client_score, date) 
                            VALUES ( ?, ?, ?, ?, ?, NOW())`;
    let list = [...await io.in(roomName).allSockets()];

    let data = [];
    if (list[0] === depeatSocket.id) {
        //내가 방장
        data.push(0); //방장패배
        data.push(depeatSocket.loginUser.id);
        data.push(io.sockets.sockets.get(list[1]).loginUser.id);
    } else {
        //내가 클라
        data.push(1); //방장승리
        data.push(io.sockets.sockets.get(list[0]).loginUser.id);
        data.push(depeatSocket.loginUser.id);
    }
    data.push(0);
    data.push(0);
    await Query(sql, data); //전적정보의 기록
}

server.listen(56789, () => {
    console.log(`Server is running on 56789 port`);
});