export class Block {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 35;
        this.padding = 2;

        this.fill = false;
        this.color = "#ff0000"
    }

    setBlockData(fill, color) {
        this.fill = fill;
        this.color = color;
    }

    update(delta) {

    }

    render(ctx) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.strokeRect(this.x * this.size + this.padding, this.y * this.size + this.padding, this.size - 1, this.size - 1);

        if (this.fill) {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x * this.size + this.padding, this.y * this.size + this.padding, this.size - 1, this.size - 1);
        }
    }
}