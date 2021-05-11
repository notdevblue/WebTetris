import { Game } from '/Game.js';

class App {
    constructor() {
        this.socket = new io();
        this.addSocketEvent();
        this.pageContainer = $(".page-container")
        this.init();
        //this.debug(); //테스트용 코드
        this.game = new Game();
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
            this.game.start();
        });
        $("#btnStart").addEventListener("Keydown", e => {
            e.preventDefault();
            return false;
        });

        $("#btnRegister").addEventListener("click", e => {
            this.registerProcess();
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
            alert(data.msg);
            if (data.status) {
                $("#loginEmail").value = "";
                $("#loginPassword").value = "";
                this.pageContainer.style.left = "-1024";
            }
        });
    }




    registerProcess() {
        let email = $("#registerEmail").value;
        let name = $("#registerName").value;
        let pw = $("#registerPass").value;
        let pwc = $("#registerPassConfirm").value;


        this.socket.emit("register-request", { email, name, pw, pwc });
    }

    // debug() {
    //     document.querySelector("#btnLogin").click();
    // }
}

function $(css) {
    return document.querySelector(css);
}

window.addEventListener("load", e => {
    let app = new App();
});