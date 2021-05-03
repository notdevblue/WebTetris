import { Game } from '/Game.js';

class App {
    constructor() {

        this.init();
        this.debug();
        this.game = new Game();
    }

    init() {
        document.querySelector("#btnLogin").addEventListener("click", () => {
            let pc = document.querySelector(".page-container");
            pc.style.left = "-2048px";
        });

        document.querySelector("#btnStart").addEventListener("click", () => {
            this.game.start();
        });

    }

    debug() {
        document.querySelector("#btnLogin").click();
    }

}

window.addEventListener("load", e => {
    let app = new App();
});