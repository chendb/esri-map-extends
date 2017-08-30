import { MapSetting } from '../map.setting';
import { EgovaTiledLayer, EgovaFeatureLayer } from './egova.layer';

declare var esri: any;
declare var dijit: any;

/**
 * 
 * 地图配置信息
 * 
 * @export
 * @class EgovaMapOptions
 */
export class EgovaMapOptions {

    public mapClick: Function;
    public mapLoad: Function;
    constructor() {

    }

    public onMapLoad(): void {
        if (this.mapLoad) {
            this.mapLoad();
        }
    }

    public onMapClick(evt: any): void {
        if (this.mapClick) {
            this.mapClick(evt);
        }
    }
}


export class EgovaMap {
    private baseLayers: EgovaTiledLayer[] = [];
    private featureLayers: EgovaFeatureLayer[] = [];
    public spatial: any;

    public ctxMenuForMap: any;
    public currentLocation: any;

    public innerMap: any;


    constructor(public mapEl: any, public options: EgovaMapOptions) {
        this.createMap();
        this.createBaseLayer();
        const _this = this;
        this.innerMap.on('load', function () {
            _this.onMapLoad(_this);
        });
    }

    public createMap(): void {
        this.spatial = new esri.SpatialReference({
            wkid: MapSetting.wkid
        });
        // 地图对象
        const map = new esri.Map(this.mapEl, {
            logo: MapSetting.logo,
            slider: MapSetting.slider,
            zoom: MapSetting.level
        });
        map.infoWindow.anchor = 'top';
        this.innerMap = map;

    }

    public createBaseLayer(): void {
        if (MapSetting.baseUrl) {
            this.addBaseLayer('base_tiled', MapSetting.baseUrl, '瓦片图层');
        }
    }

    public onMapLoad(egovaMap: EgovaMap): void {
        if (egovaMap.options.onMapLoad) {
            egovaMap.options.onMapLoad();
        }

        /**
         * 检测图层的_map对象是否为null,如果为null则把当前地图对象赋值给它（解决图层添加后没关联地图情况）
         */
        (<any[]>egovaMap.innerMap.layers).forEach(layer => {
            if (layer._map == undefined) {
                layer._map == egovaMap.innerMap;
            }
        });

        egovaMap.innerMap.on("click", function (evt: any) {
            egovaMap.options.onMapClick(evt);
        });
    }

    public get infoWindow() {
        return this.innerMap.infoWindow;
    }

    public addBaseLayer(id: String, url: String, title: String): void {
        if (this.getBaseLayerById(id)) {
            throw Error('图层' + id + '已存在');
        }
        const layer = new EgovaTiledLayer(id, url, title);
        this.baseLayers.push(layer);
        layer.appendTo(this.innerMap);
    }

    public getBaseLayerById(id: String): EgovaTiledLayer | undefined {
        const layers = this.baseLayers.filter(g => g.id === id);
        if (layers && layers.length > 0) {
            return layers[0];
        }
        return undefined;
    }

    public showBaseLayer(id: String): boolean {
        const layer = this.getBaseLayerById(id);
        if (layer) {
            layer.show();
            return true;
        }
        return false;
    }

    public getFeatureLayerById(id: String): EgovaFeatureLayer | undefined {
        const layer = this.featureLayers.find(g => g.id === id);
        return layer;
    }

    public addDeviceLayer(deviceLayer: EgovaFeatureLayer) {
        if (this.getFeatureLayerById(deviceLayer.id)) {
            throw Error('图层' + deviceLayer.id + '已存在');
        }
        this.featureLayers.push(deviceLayer);
        deviceLayer.appendTo(this.innerMap);
    }

    public addFeatureLayer(id: String, title: String): void {
        if (this.getFeatureLayerById(id)) {
            throw Error('图层' + id + '已存在');
        }
        const layer = new EgovaFeatureLayer(id, title);
        this.featureLayers.push(layer);
        layer.appendTo(this.innerMap);
    }

    public showFeatureLayer(id: String): boolean {
        const layer = this.getFeatureLayerById(id);
        if (layer) {
            layer.show();
            return true;
        }
        return false;
    }

    public removeFeatureLayer(id: String): boolean {
        const flayer = this.getFeatureLayerById(id);
        if (flayer) {
            this.innerMap.removeLayer(flayer.layer);
            const i = this.featureLayers.indexOf(flayer);
            this.featureLayers.splice(i, 1);
            return true;
        }
        return false;
    }

    /**
     * 中心定位
     */
    public centerAt(x: number, y: number): void {
        this.innerMap.centerAt(new esri.geometry.Point(x, y, this.spatial)).then(function () {
            console.log("centerAt:" + x + "," + y);
        });
    }

    /**
     *
     * 创建菜单
     *
     * @param {{ contextMenu: any[], contextMenuClickEvent: any }} options
     * @memberof EgovaMap
     */
    public createContextMenu(options: { contextMenu: any[], contextMenuClickEvent: any }): void {

        const menus = options.contextMenu;
        const _this = this;
        _this.ctxMenuForMap = new dijit.Menu({
            onOpen: function (box: any) {
                _this.currentLocation = _this.getMapPointFromMenuPosition(box);
            }
        });
        for (let i = 0; i < menus.length; i++) {
            _this.ctxMenuForMap.addChild(new dijit.MenuItem({
                label: menus[i],
                onClick: function (evt: any) {
                    options.contextMenuClickEvent(this.label);
                }
            }));
        }
        _this.ctxMenuForMap.startup();
        _this.ctxMenuForMap.bindDomNode(_this.innerMap.container);
    }

    /**
     * 获取菜单单击的坐标信息
     *
     * @param {any} box
     * @returns {*}
     * @memberof EgovaMap
     */
    public getMapPointFromMenuPosition(box: any): any {
        const _this = this;
        let x = box.x,
            y = box.y;
        switch (box.corner) {
            case 'TR':
                x += box.w;
                break;
            case 'BL':
                y += box.h;
                break;
            case 'BR':
                x += box.w;
                y += box.h;
                break;
        }

        const screenPoint = new esri.geometry.Point(x - _this.innerMap.position.x, y - _this.innerMap.position.y);
        return _this.innerMap.toMap(screenPoint);
    }


    /**
     * 查找图中所有设备信息
     *
     * @param {number} lon 经度
     * @param {number} lat 纬度
     * @param {number} radius 半径
     * @returns {{ layer: EgovaFeatureLayer, selectedItems: any[] }[]}
     * @memberof EgovaMap
     */
    public buffer(lon: number, lat: number, radius: number): { layer: EgovaFeatureLayer, selectedItems: any[] }[] {

        const pt = new esri.geometry.Point(lon, lat, this.spatial);
        const buffer = esri.geometry.geometryEngine.geodesicBuffer(pt, radius / 1000, 'kilometers');

        const circle = new esri.geometry.Circle({
            center: pt,
            geodesic: true,
            radiusUnit: esri.Units.MILES,
            radius: radius
        });
        const graphicGrops = [];
        const geos = new esri.Graphic(circle);
        for (let i = 0; i < this.featureLayers.length; i++) {
            const flayer = this.featureLayers[i];
            const graphics = <any[]>flayer.layer.graphics;
            const gs = {
                layer: flayer,
                selectedItems: <any[]>[]
            };
            for (let j = 0; j < graphics.length; j++) {
                if (esri.geometry.geometryEngine.contains(buffer, graphics[j].geometry, this.spatial)) {
                    gs.selectedItems.push(graphics[j]);
                }
            }
            graphicGrops.push(gs);
        }

        return graphicGrops;
    }


    /**
    * Graphic的width
    */
    public getGraphicWidth(level?: number): number {
        const a = this.getGraphicSize(level);
        return a;
    }
    /**
     * Graphic的Height
     */
    public getGraphicHeight(level?: number): number {
        const a = this.getGraphicSize(level);
        return a;
    }
    /**
     * Graphic的Size
     */
    public getGraphicSize(level?: number): number {
        level = level ? level : this.innerMap.getLevel();
        return MapSetting.graphicBaseSize + MapSetting.graphicSizeFactor * <number>level;
    }

    public getHoverLevel(isHover: boolean) {
        const level = isHover ? (this.innerMap.getLevel() + MapSetting.graphicHoverLevel) : this.innerMap.getLevel();
        return level;
    }

}
