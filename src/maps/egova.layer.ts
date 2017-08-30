declare var esri: any;

/**
 * 底图包装类
 *
 * @export
 * @class EgovaTiledLayer
 */
export class EgovaTiledLayer {

    public layer: any;
    public isShow: Boolean = false;

    constructor(public id: String, public url: String, public title: String) {
        this.layer = new esri.layers.ArcGISTiledMapServiceLayer(url);
    }

    public appendTo(map: any): void {
        map.addLayer(this.layer);
    }

    public show(): void {
        this.isShow = true;
        this.layer.show();
    }

    public hide(): void {
        this.isShow = false;
        this.layer.hide();
    }
}


/**
 * 功能图层包装类
 *
 * @export
 * @class EgovaFeatureLayer
 */
export class EgovaFeatureLayer {


    public layer: any;
    public isShow: Boolean = false;


    constructor(public id: String, public title: String) {
        this.layer = new esri.layers.GraphicsLayer(id);
    }

    public appendTo(map: any): void {
        map.addLayer(this.layer);
    }

    public clear(): void {
        this.layer.clear();
    }

    public show(): void {
        this.isShow = true;
        this.layer.show();
    }

    public hide(): void {
        this.isShow = false;
        this.layer.hide();
    }


    /**
     * 获取资源要素点
     */
    public getGraphicById(key: string): any {
        const graphics = this.layer.graphics;
        for (let i = 0; i < graphics.length; i++) {
            const attrs = graphics[i].attributes;
            if (attrs.id === key) {
                return graphics[i];
            }
        }
        return null;
    }

    /**
     * 删除资源要素点
     */
    public removeGraphicById(key: string) {
        const graphic = this.getGraphicById(key);
        if (graphic != null) {
            this.layer.remove(graphic);
        }
    }
}


/**
 * 分组图层(用于需要多个要素叠加效果情况)
 * 
 * @export
 * @class EgovaGroupLayer
 */
export class EgovaGroupLayer {


    public layer: any;
    public isShow: Boolean = false;


    constructor(public id: String) {
        this.layer = new esri.layers.GraphicsLayer(id);
    }

    public get _map() {
        return this.layer._map;
    }

    public get graphics(): any[] {
        return this.layer.graphics;
    }

    public appendTo(map: any): void {
        map.addLayer(this.layer);
    }

    public clear(): void {
        this.layer.clear();
    }

    public show(): void {
        this.isShow = true;
        this.layer.show();
    }

    public hide(): void {
        this.isShow = false;
        this.layer.hide();
    }

    public setGeometry(name: string, geometry: any) {
        this.getGraphicByName(name).forEach(g => {
            g.setGeometry(geometry);
        });
    }

    public setSymbol(name: string, symbol: any) {
        this.getGraphicByName(name).forEach(g => {
            g.setSymbol(symbol);
        });
    }

    public showGraphice(name: string) {
        this.getGraphicByName(name).forEach(g => {
            if (g.__symbol) {
                g.setSymbol(g.__symbol);
            }
        });
    }

    public hideGraphice(name: string) {
        this.getGraphicByName(name).forEach(g => {
            g.__symbol = g.getSymbol();
            g.setSymbol(null);
        });
    }


    public addGraphice(name: string, graphics: any[]) {
        graphics.forEach((g, index) => {
            g.attributes.master = index == 0;
            g.attributes.name = name;
            this.layer.add(g);
        });
    }


    public getMasterGraphicByName(name: string): any {
        (<any[]>this.layer.graphics).forEach(element => {
            if (name == element.attributes.name && element.master) {
                return element;
            }
        });
        return null;
    }

    /**
     * 获取资源要素点
     */
    public getGraphicByName(name: string): any[] {
        const graphics = [];
        for (let i = 0; i < this.layer.graphics.length; i++) {
            const attrs = this.layer.graphics[i].attributes;
            if (attrs.name === name) {
                graphics.push(this.layer.graphics[i]);
            }
        }
        return graphics;
    }

    /**
     * 删除资源要素点
     */
    public removeGraphicByName(name: string) {
        const graphic = this.getGraphicByName(name);
        if (graphic != null) {
            this.layer.remove(graphic);
        }
    }
}