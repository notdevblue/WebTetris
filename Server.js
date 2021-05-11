const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const path = require('path');
const { Query, Pool } = require('./DB.js');

const app = new express(); // 익스프레스 웹서버 열음
const server = http.createServer(app); // 웹서버에 익스프레스 붙임
const io = socketio(server); // 해당 서버에 소켓도 붙임

app.use(express.static('public')); // /로 시작하는 건 저기에

app.get('/', (req, res) => {
    // 어떤 요청이 오든 html
    res.sendFile(path.join(__dirname, "views", "index.html"));
});

io.on("connect", socket => {
    console.log(`서버에 새로운 소켓이 착륙했어요 : ${socket.id}`);

    socket.on("login-process", async data => {
        const { email, pw } = data;
        let sql = "SELECT * FROM users WHERE email = ? AND password = PASSWORD(?)";
        let result = await Query(sql, [email, pw]);
        if (result.length !== 1) {
            socket.emit("login-response", { status: false, msg: "로그인 실패" });
            return;
        }

        socket.emit("login-response", { status: true, msg: "로그인 성공" });
        socket.loginUser = result[0]; // 로그인된 유저를 socket 데이터에 넣어준다.

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
})


server.listen(56789, () => {
    console.log("server is running on port: 56789");
});