const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const { Query, Pool } = require('./DB.js');
const State = require("./State.js");

const app = new express(); // 익스프레스 웹서버 열음
const server = http.createServer(app); // 웹서버에 익스프레스 붙임
const io = socketio(server); // 해당 서버에 소켓도 붙임

app.use(express.static('public')); // /로 시작하는 건 저기에

app.get('/', (req, res) => {
    // 어떤 요청이 오든 html
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

let roomList = [
    //{ name: '', roomName: 1, number: 1 }
];

io.on("connect", socket => {
    console.log(`서버에 새로운 소켓이 착륙했어요 : ${socket.id}`);
    socket.state = State.IN_LOGIN;

    socket.on("disconnecting", () => {
        console.log(`${socket.id}님이 떠나셨어요.`);
        if (socket.state === State.IN_GAME || socket.state === State.IN_PLAYING) {
            let rooms = [...socket.rooms];
            let targetRoom = rooms.find(x => x !== socket.id);
            roomList.findIndex(x => x.roomName === targetRoom);
            roomList[i].number--;
            if (roomList[idx].number <= 0) {
                roomList.splice(idx, 1); // 해당방 제거
            } else if (socket.state === State.IN_GAME) {
                io.to(roomList[idx].roomName).meit("leave-player", { isAdmin: true });
            } else if (socket.state === State.IN_PLAYING) {
                io.to(roomList[idx].roomName).meit("leave-player", { isAdmin: false });
                // 승패 따른 DB 작업
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

        socket.emit("login-response", { status: true, msg: "로그인 성공", roomList });
        socket.loginUser = result[0]; // 로그인된 유저를 socket 데이터에 넣어준다.
        socket.state = State.IN_LOBBY;

    });


    socket.on("register-request", async data => {
        const { email, name, pw, pwc } = data;
        console.log(email.trim() === "");
        console.log(name.trim() === "");
        console.log(pw.trim() === "");
        console.log(pw !== pwc);


        if (email.trim() === "" || name.trim() === "" || pw.trim() === "" || pw !== pwc) {
            socket.emit("register-response", { status: false, msg: "비어있거나 비밀번호 확인이 올바르지 않습니다." });
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
            socket.emit("bad-access", { msg: "잘못된 접근입니다" });
            return;
        }

        const { name } = data;

        const roomName = roomList.length < 1 ? 1 : Math.max(...roomList.map(x => x.roomName)) + 1; // 번호만 뽑힘
        roomList.push({ name, roomName, number: 1 });
        socket.join(roomName); // 해당 소켓을 해당 룸으로 진입시킴

        socket.state = State.IN_GAME;
        socket.emit("enter-room");

    });

    socket.on("join-room", data => {
        if (socket.state !== State.IN_LOBBY) {
            socket.emit("bad-access", { msg: "잘못된 접근입니다." });
            return;
        }
        const { roomName } = data;
        let targetRoom = roomList.find(x => x.roomName === roomName);

        if (targetRoom === undefined || targetRoom.number >= 2) {
            socket.emit("bad-access", { msg: "들어갈 수 없는 방입니다." });
            return;
        }

        socket.join(roomName); //해당 방에 조인

        socket.emit("join-room");
        socket.state = State.IN_GAME;
        ++targetRoom.number;
    });

    socket.on("game-start", data => {

        if (socket.state !== State.IN_GAME) {
            socket.emit("bad-access", { msg: "잘못된 접근입니다." });
            return;
        }

        let socketRooms = [...socket.rooms];
        socketRooms = socketRooms.filter(x => x != socket.id);

        let room = socketRooms.find(x => x != socket.id);
        let targetRoom = roomList.find(x => x.roomName === room);
        if (targetRoom === undefined || targetRoom.number < 2) {
            socket.emit("bad-access", { msg: "시작할 수 없는 상태입니다." });
            return;
        }

        socket.state = State.IN_PLAYING;
        io.to(room).emit("game-start");
    });

    socket.on("in-playing", data => {
        socket.state = State.IN_PLAYING;
    })
});


server.listen(56789, () => {
    console.log("server is running on port: 56789");
});