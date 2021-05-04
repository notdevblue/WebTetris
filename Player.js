//김경혁, 김민준, 서동연, 한우.
import { Game } from '/Game.js';
// typescript

export class Player {
    constructor() {
        this.blockSet = [
            [
                [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
                [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
            ], //작대기
            [
                [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: -1 }],
            ], //네모
            [
                [{ x: 0, y: -2 }, { x: 0, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }],
                [{ x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
                [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
                [{ x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }]
            ], // ㄴ
            [
                [{ x: 0, y: -2 }, { x: 0, y: -1 }, { x: 0, y: 0 }, { x: -1, y: 0 }],
                [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
                [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
                [{ x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 1 }]
            ], // 역ㄴ
            [
                [{ x: -1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }, { x: 1, y: 0 }],
                [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
            ], // _┌━ 모양
            [
                [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
                [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }, { x: 1, y: -1 }],
            ], // ─┐_ 모양
            [
                [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 0, y: -1 }, { x: 1, y: 0 }],
                [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 0 }],
                [{ x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }],
                [{ x: 0, y: -1 }, { x: 0, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }]
            ] // ㅗ 모양
        ]

        this.colorSet = ["#0000e8", "#00e800", "#00e8e8", "#e89b00", "#e8e800", "#9900e7", "#e80000"];

        let blockSeq = [];
        let temp = [];
        for (let i = 0; i < this.blockSet.length; ++i) {
            temp.push(i);
        }
        for (let i = 0; i < this.blockSet.length; ++i) {
            let idx = Math.floor(Math.random() * temp.length);
            this.blockSeq.push(temp[idx]);
            temp.splice(idx, 1);
        }

        this.idx = 0;
        this.currentBlock = this.blockSeq[this.idx];
        this.nextBlock = this.blockSeq[this.idx + 1];
        this.currentRot = 0; //블럭회전상태

        this.x = 0;
        this.y = 0;
        this.initPosition(); //위치 초기화
        this.setBlockData(true, this.colorSet[this.currentBlock]);
    }

    initPosition() {
        this.x = 5;
        this.y = 2;
        this.currentRot = 0;
        if (this.currentBlock != 2 && this.currentBlock != 3) {
            this.y = 1;
        }
    }

    getNextBlockSet() {
        this.idx = (this.idx + 1) % this.blockSeq.length;
        this.nextIdx = (this.idx + 1) % this.blockSeq.length;
        this.currentBlock = this.blockSeq[this.idx];
        this.nextBlock = this.blockSeq[this.nextIdx];
        this.initPosition();
    }

    moveLeft() {
        this.setBlockData(false);
        this.x -= 1;
        if (!this.checkPossible()) {
            this.x += 1;
        }
        this.setBlockData(true, this.colorSet[this.currentBlock]);
    }

    moveRight() {
        this.setBlockData(false);
        this.x += 1;
        if (!this.checkPossible()) {
            this.x -= 1;
        }
        this.setBlockData(true, this.colorSet[this.currentBlock]);
    }

    rotate() {
        this.setBlockData(false);
        let temp = this.currentRot;
        this.currentRot = (this.currentRot + 1) % this.blockSet[this.currentBlock].length;
        if (!this.checkPossible()) {
            this.currentRot = temp;
        }
        this.setBlockData(true, this.colorSet[this.currentBlock]);
    }

    // 성공적 내려감 == true 리턴
    moveDown() {
        this.setBlockData(false);
        this.y += 1;
        if (!this.checkPossible()) {
            this.y -= 1;
            this.setBlockData(true, this.colorSet[this.currentBlock]);
            this.getNextBlockSet();
            Game.instance.checkLine();
            this.setBlockData(true, this.colorSet[this.currentBlock]);
            return false;
        } else {
            this.setBlockData(true, this.colorSet[this.currentBlock]);
            return true;
        }

    }

    straightDown() {
        while (this.moveDown()) {

        }
    }

    // 좌우이동
    // 돌리기
    // 내리기
    // 한번에 내리기
    // 다음블럭과 스왑, 킵
    setBlockData(fill, color = "#fff") {
        const arr = Game.instance.arr;
        const cb = this.currentBlock;
        const cr = this.currentRot;
        for (let i = 0; i < this.blockSet[cb][cr].length; i++) {
            let data = this.blockSet[cb][cr][i]; // 4개의 블럭포인트들에서 순서대로 한개씩 가져온다.

            arr[this.y + data.y][this.x + data.x].setBlockData(fill, color);
        }
    }

    checkPossible() {
        const arr = Game.instance.arr;
        const cb = this.currentBlock;
        const cr = this.currentRot;

        for (let i = 0; i < this.blockSet[cb][cr].length; ++i) {
            let data = this.blockSet[cb][cr][i];
            if (this.y + data.y < 0 || this.x + data.x < 0 ||
                this.y + data.y >= arr.length || this.x + data.x >= arr[0].length) {

                return false;
            }

            if (arr[this.y + data.y][this.x + data.x].fill) return false;
        }

        return true;
    }
}