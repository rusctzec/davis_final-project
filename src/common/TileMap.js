export default class TileMap extends Array {
    constructor(width, height, canvasUpdate) {
        super(width);

        this.width = width;
        this.height = height;
         
        this.data = Array(width);
        for (let i=0; i<width; i++) {
            this[i] = Array(height).fill(0);
        }

        if (!canvasUpdate) return
        this.update(canvasUpdate);
    }

    update(canvasUpdate) {
        let {x, y, data, size, fill} = canvasUpdate;
        x = x || 0; y = y || 0;
        try {
        switch (canvasUpdate.type) {
            case "rect":
                if (x == null || y == null || size == null) return;
                for (let i = x; i < x+size && i < this.width; i++) {
                    for (let j = y; j < y+size && j < this.height; j++) {
                    if (i < 0 || j < 0) continue;
                    let col = this[i];
                    if (!col) console.log("COL IS NULL", this.length);
                    col[j] = fill===-1?0:1;
                    }
                }
                break;
            case "array":
                if (data == null) return;
                let lenX = data.length; if (lenX === 0) return;
                let lenY = data[0].length;
                for (let i=0; i < lenX && i < this.width; i++) {
                    for (let j=0; j < lenY && j < this.height; j++) {
                    let val = data[i][j]; if (val === 0 || i+x < 0 || j+y < 0 || i+x >= this.width || j+y >= this.height) continue;
                    if (val === -1) this[x+i][y+j] = 0;
                    else this[x+i][y+j] = 1;
                    }
                }
                break;
            case "png":
                if (data == null) return;
                break;
        }
        } catch (e) {canvasUpdate.data = !!canvasUpdate.data; console.error("CANVAS_UPDATE_ERROR", e, canvasUpdate)}
    }

    get(x, y) {
      let col = this[x];
      return (col ? col[y] : undefined);
    }

    set(x, y, int) {
      if (int == 0) return;
      let col = this[x];
      if (col && col[y] != undefined) col[y] = (int == -1 ? 0 : int);
    }
}