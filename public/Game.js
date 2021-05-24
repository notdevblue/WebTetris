import { Player } from '/Player.js';
import { Block } from '/Block.js';
import { $ } from '/query.js';

export class Game {
    static instance = null;

    constructor(socket) {
        this.socket = socket;
        this.addSocketEvent();
        this.canvas = document.querySelector("#gameCanvas");
        this.ctx = this.canvas.getContext("2d");

        this.otherCanvas = document.querySelector("#otherCanvas");
        this.oCtx = this.otherCanvas.getContext("2d");

        this.frame = null;
        this.player = null; //가독성을 위한 코드
        this.arr = [];
        this.addKeyEvent(); // 한번만 실행해야 함 (키 한번씩 누를때 두번 움직일 수 있음)

        this.score = 0;
        this.scoreBox = document.querySelector(".score-box");
        this.time = 2000;
        this.currentTime = 0;

        this.gameOverPanel = document.querySelector("#gameOverBox");
        this.gameOver = false;

        this.addLineCount = 0;
    }

    setGameOver(isWin = false) {
        this.gameOver = true;
        clearInterval(this.frame);
        this.gameOverPanel.classList.add("on");

        if (isWin) {
            this.gameOverPanel.querySelector(".title").innerHTML = "You Win";
            this.socket.emit("game-won");
        } else {
            this.gameOverPanel.querySelector(".title").innerHTML = "You Lose";
            this.socket.emit("game-lose");
        }

        this.render();
    }

    addKeyEvent() {
        document.addEventListener("keydown", e => {
            if (this.player == null || this.gameOver) return;
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

        this.scoreBox.innerHTML = `${this.score} 점`;

        if (this.player !== null) {
            this.player.render(this.ctx);
        }

    }

    reset() {
        this.gameOverPanel.classList.remove('on');
        this.gameOver = false;
        this.arr = [];
        for (let i = 0; i < 20; i++) {
            let row = [];
            for (let j = 0; j < 10; j++) {
                row.push(new Block(j, i));
            }
            this.arr.push(row);
        }

        this.render();
    }

    start() {
        if (this.frame != null) {
            clearInterval(this.frame);
        }
        this.frame = setInterval(() => {
            this.update();
            this.render();
        }, 1000 / 30);



        //this.debug();
        this.player = new Player();
        this.time = 2000;
    }

    checkLine() {
        let removedCount = 0;
        let clearedCount = 0;
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
                this.addScore();
                ++i;
                ++removedCount;
                ++clearedCount;
            }
        }

        if (this.addLineCount > 0) {
            if (this.addLineCount >= removedCount) {
                this.addLineCount -= removedCount;
                removedCount = 0;
            } else {
                removedCount -= this.addLineCount;
                this.addLineCount = 0;
            }
        }


        if (removedCount > 0) {
            this.socket.emit("remove-line", { count: removedCount });
        }

        if (this.addLineCount > 0) {
            this.addLine(this.addLineCount);
            this.addLineCount = 0;
        }



        let sendData = [];
        for (let i = 0; i < this.arr.length; ++i) {
            sendData.push(this.arr[i].map(x => ({ color: x.color, fill: x.fill })));
        }

        this.socket.emit("game-data", { sendData });
    }

    addSocketEvent() {
        this.socket.on("game-data", data => {
            const { sendData, sender } = data; // 나중에 다중역할 위해 sender.
            this.drawOtherCanvas(sendData);
        });

        this.socket.on("remove-line", data => {
            const { count, sender } = data;
            this.addLineCount += count;
        });

        this.socket.on("game-win", data => {
            this.setGameOver(true);
        });

        this.socket.on("leave-player", data => {
            const { isAdmin } = data;
            if (isAdmin) {
                document.querySelector("#btnStart").disabled = false;
            } else {
                this.setGameOver(true);
            }
        });



    }

    addLine(count) {
        for (let i = count; i < this.arr.length; ++i) {
            for (let j = 0; j < this.arr[i].length; ++j) {
                this.arr[i - count][j].copyBlockData(this.arr[i][j]);
            }
        }

        for (let i = this.arr.length - count; i < this.arr.length; ++i) {
            let empty = Math.floor(Math.random() * this.arr[i].length);
            for (let j = 0; j < this.arr[i].length; ++j) {
                if (j !== empty) {
                    this.arr[i][j].setBlockData(true, "#555");
                } else {
                    this.arr[i][j].setBlockData(false, "#fff");
                }
            }
        }
    }

    addScore() {
        ++this.score;
        if (this.score % 5 == 0 && this.time >= 100) {
            this.time -= 300;
            if (this.time < 100) {
                time = 100;
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

    drawOtherCanvas(data) {
        this.oCtx.clearRect(0, 0, 100, 200); // 기존 그림 클리어하고 새로그림
        for (let i = 0; i < data.length; ++i) {
            for (let j = 0; j < data[i].length; ++j) {
                if (data[i][j].fill) {
                    this.oCtx.fillStyle = data[i][j].color;
                    this.oCtx.fillRect(j * 10, i * 10, 10, 10);
                }
            }
        }
    }

    debug() {
        this.arr[19][0].setBlockData(true, "#007bff");
        this.arr[19][1].setBlockData(true, "#007bff");
        this.arr[19][2].setBlockData(true, "#007bff");
        this.arr[19][3].setBlockData(true, "#007bff");
    }
}