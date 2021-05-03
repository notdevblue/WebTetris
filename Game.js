import { Block } from '/Block.js';

export class Game {
    constructor() {
        this.canvas = document.querySelector("#gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.frame = null;

        this.arr = [];
    }

    update() {
        this.arr.forEach(row => row.forEach(item => item.update(1000 / 30)));
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
        for (let i = 0; i < 20; ++i) {
            let row = [];
            for (let j = 0; j < 10; ++j) {
                row.push(new Block(j, i));
            }
            this.arr.push(row);
        }
        //this.debug();
    }

    debug() {
        this.arr[19][0].setBlockData(true, "#007bff")
        this.arr[19][1].setBlockData(true, "#007bff")
        this.arr[19][2].setBlockData(true, "#007bff")
        this.arr[19][3].setBlockData(true, "#007bff")
    }
}