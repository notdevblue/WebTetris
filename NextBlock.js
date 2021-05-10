import { Block } from "/Block.js";

export class NextBlock {
    constructor() {

        this.arr = [];
        for (let i = 0; i < 4; ++i) {
            this.arr[i] = [];
            for (let j = 0; j < 4; ++j) {
                this.arr[i][j] = new Block(j, i, 24);
            }
        }

        this.nextCanvas = document.querySelector("#nextCanvas");
        this.nextCtx = this.nextCanvas.getContext("2d");
    }


    render() {
        this.nextCtx.clearRect(0, 0, 100, 100);
        this.arr.forEach(row => row.forEach(col => col.render(this.nextCtx)));

        // for (let i = 0; i < this.arr.length; ++i) {
        //     for (let j = 0; j < this.arr[i].length; ++j) {
        //         this.arr[i][j].render(ctx);
        //     }
        // }
    }

    setNextBlock(data, color) {
        let x = 1;
        let y = 1;

        if (x + Math.min(...data.map(x => x.x)) < 0) {
            ++x;
        }
        if (y + Math.min(...data.map(y => y.y)) < 0) {
            ++y;
        }


        this.arr.forEach(row => row.forEach(col => col.setBlockData(false, "#fff")));
        for (let i = 0; i < data.length; i++) {
            let point = data[i];
            this.arr[y + point.y][x + point.x].setBlockData(true, color);
        }


    }
}