import { Player } from '/Player.js';
import { Block } from '/Block.js';

export class Game {
    static instance = null;

    constructor() {
        this.canvas = document.querySelector("#gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.frame = null;
        this.player = null; //가독성을 위한 코드
        this.arr = [];
        this.addKeyEvent(); // 한번만 실행해야 함 (키 한번씩 누를때 두번 움직일 수 있ㅇ,ㅁ)

        this.time = 2000;
        this.currentTime = 0;
    }

    addKeyEvent() {
        document.addEventListener("keydown", e => {
            if (this.player == null) return;
            if (e.keyCode == 37) {
                this.player.moveLeft();
            } else if (e.keyCode == 39) {
                this.player.moveRight();
            } else if (e.keyCode == 38) {
                this.player.rotate();
            } else if (e.keyCode == 40) {
                this.player.moveDown();
            } else if (e.keyCode == 32) {
                this.player.straightDown();
            }
        });
    }

    update() {
        this.arr.forEach(row => row.forEach(item => item.update(1000 / 30)));

        this.currentTime += 1000 / 30;
        if (this.currentTime >= this.time) {
            this.currentTime = 0;
            this.player.moveDown();
        }
        // 한줄 삭제시 스코어 증가
        // 스코어는 화면에 표시 (콘솔창 가능)
        // 스코어가 올라갈 때마다 Time 이 줄어서 최대 0.5초까지 줄어든다.
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.arr.forEach(row => row.forEach(item => item.render(this.ctx)));
    }

    start() {
        if (this.frame != null) {
            clearInterval(this.frame);
        }
        this.frame = setInterval(() => {
            this.update();
            this.render();
        }, 1000 / 30);

        this.arr = [];
        for (let i = 0; i < 20; i++) {
            let row = [];
            for (let j = 0; j < 10; j++) {
                row.push(new Block(j, i));
            }
            this.arr.push(row);
        }

        //this.debug();
        this.player = new Player();
        this.time = 2000;
    }

    checkLine() {
        for (let i = this.arr.length - 1; i >= 0; --i) {
            let full = true;
            for (let j = 0; j < this.arr[i].length; ++j) {
                if (!this.arr[i][j].fill) {
                    full = false;
                    break;
                }
            }

            if (full) {
                this.lineRevmove(i); // i 윗줄을 전부 내림
                ++i;
            }
        }
    }

    lineRevmove(from) {
        for (let i = from; i >= 1; --i) {

            for (let j = 0; j < this.arr[i].length; ++j) {
                this.arr[i][j].copyBlockData(this.arr[i - 1][j]);
            }
        }
        for (let j = 0; j < this.arr[0].length; ++j) {
            this.arr[0][j].setBlockData(false);
        }
    }

    debug() {
        this.arr[19][0].setBlockData(true, "#007bff");
        this.arr[19][1].setBlockData(true, "#007bff");
        this.arr[19][2].setBlockData(true, "#007bff");
        this.arr[19][3].setBlockData(true, "#007bff");
    }
}