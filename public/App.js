import { Game } from '/Game.js';

class App {
    constructor() {
        this.socket = new io();
        this.addSocketEvent();
        this.pageContainer = $(".page-container")
        this.init();
        //this.debug(); //테스트용 코드
        this.game = new Game(this.socket);
        Game.instance = this.game;
    }

    init() {
        $("#btnLogin").addEventListener("click", () => {
            let email = $("#loginEmail").value;
            let pw = $("#loginPassword").value;

            if (email.trim() === "" || pw.trim() === "") {
                alert("필수값이 비어있습니다.");
                return;
            }

            this.socket.emit("login-process", { email, pw });
        });

        $("#btnStart").addEventListener("click", () => {
            //this.game.start();
            this.socket.emit("game-start");
        });

        $("#btnStart").addEventListener("Keydown", e => {
            e.preventDefault();
            return false;
        });

        $("#btnRegister").addEventListener("click", e => {
            this.registerProcess();
        })

        $("#btnCreateRoom").addEventListener("click", e => {
            this.createRoom();
        });

        document.addEventListener("keydown", e => {
            if (e.keyCode == 81) {
                this.debug("test", "test");
                setTimeout(() => {
                    this.socket.emit("create-room", { name: "더미 방입니다." });
                }, 500);
            } else if (e.keyCode == 87) {
                this.debug("test2", "test2");
                setTimeout(x => {
                    this.socket.emit("join-room", { roomName: 1 });
                }, 500);
            }
        })

    }

    addSocketEvent() {
        this.socket.on("register-response", data => {
            alert(data.msg);
            if (data.status) {
                $("registerEmail").value = "";
                $("registerName").value = "";
                $("registerPass").value = "";
                $("registerPassConfirm").value = "";
            }
        });

        this.socket.on("login-response", data => {
            //alert(data.msg);
            if (data.status) {
                $("#loginEmail").value = "";
                $("#loginPassword").value = "";
                this.pageContainer.style.left = "-1024px";

                const roomBox = $("#roomListBox");
                roomBox.innerHTML = "";
                data.roomList.forEach(room => {
                    let div = document.createElement("div");
                    div.classList.add("room");
                    div.innerHTML = `<span class="name">${room.name}</span>
                                    <span class="number">${room.number}</span>`;
                    div.addEventListener("click", e => {
                        this.socket.emit("join-room", { roomName: room.roomName });
                    });

                    roomBox.appendChild(div);
                });
            }
        });

        this.socket.on("enter-room", data => {
            this.pageContainer.style.left = "-2048px";
        });

        this.socket.on("join-room", data => {
            this.pageContainer.style.left = "-2048px";
            //$("#btnStart").style.visibility = "hidden";
            $("#btnStart").disabled = true;
        });

        this.socket.on("bad-access", data => {
            alert(data.msg);
        });

        this.socket.on("game-start", data => {
            this.game.start();
            this.socket.emit("in-playing");
        });
    }

    createRoom() {
        let result = prompt("방 이름을 입력하세요.");
        if (result !== "" && result !== null) {
            this.socket.emit("create-room", { name: result });
        } else {
            alert("방이름이 있어야 합니다.");
        }
    }


    registerProcess() {
        let email = $("#registerEmail").value;
        let name = $("#registerName").value;
        let pw = $("#registerPass").value;
        let pwc = $("#registerPassConfirm").value;


        this.socket.emit("register-request", { email, name, pw, pwc });
    }

    debug(id, pw) {
        $("#loginEmail").value = id;
        $("#loginPassword").value = pw;
        $("#btnLogin").click();
    }
}

function $(css) {
    return document.querySelector(css);
}

window.addEventListener("load", e => {
    let app = new App();
});