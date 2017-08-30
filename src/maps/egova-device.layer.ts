declare var esri: any;
declare var dojo: any;

import { EgovaFeatureLayer } from './egova.layer';
import { EgovaMap } from './egova.map';
import { MapUtils } from './map.utils';

export class DeviceLayerOptions {


    constructor(public id: String, public title: String) {

    }

    public showInfoWindowOnClick: boolean;
    public showTooltipOnHover?: boolean;
    public activeSelected?: boolean;
    public isMultSelect?: boolean;
    public selectChanged: Function;
    public positionChanged: Function;

    public onSelectChanged(selected: boolean, target: any, selectedList: any[]) {
        if (this.selectChanged) {
            this.selectChanged({
                selected: selected,
                target: target,
                selectedList: selectedList
            });
        }

    }

    public onPositionChanged(startAndEndGeo: any[], graphic: any) {
        if (this.positionChanged) {
            this.positionChanged({
                startGeometry: startAndEndGeo[0],
                endGeometry: startAndEndGeo[1],
                graphic: graphic
            });
        }
    }
}

/**
 * 设备图层基类
 * 该图层一个需要了类继续并实现里面的抽象方法。常用功能如下：
 *   1、显示设备信息:showDatas(dataList:any[])
 *   2、对设备信息分组（onlineGraphics,offlineGraphics）
 *   3、定制化设备图标getIconName(device:any)
 *   4、不同状态设备图标定制getIconUrl(info: any)
 *   5、图标单击信息框定制 getInfoWindowContent(graphic: any), getInfoWindowTitle(graphic: any): String;
 * 
 * @export
 * @abstract
 * @class EgovaDeviceLayer
 * @extends {EgovaFeatureLayer}
 */
export abstract class EgovaDeviceLayer extends EgovaFeatureLayer {

    /**
     * 设备图标名称
     * 
     * @private
     * @type {string}
     * @memberof EgovaDeviceLayer
     */
    private iconName: string;
    /**
     * 在线要素
     *
     * @type {any[]}
     * @memberof EgovaDeviceLayer
     */
    public onlineGraphics: any[] = [];

    /**
     * 离线要素
     *
     * @type {any[]}
     * @memberof EgovaDeviceLayer
     */
    public offlineGraphics: any[] = [];

    constructor(public egovaMap: EgovaMap, public options: DeviceLayerOptions) {
        super(options.id, options.title);

        // 地图加载事件处理
        if (this.egovaMap.innerMap.loaded) {
            this.onLoad(this);
        } else {
            const _deviceLayer = this;
            this.egovaMap.innerMap.on('load', function () {
                _deviceLayer.onLoad(_deviceLayer);
            });
        }
        this.egovaMap.addDeviceLayer(this);
    }

    public onLoad(deviceLayer: EgovaDeviceLayer): void {
        if (!deviceLayer.layer._map) {
            deviceLayer.layer._map = deviceLayer.egovaMap.innerMap;
        }
        deviceLayer.registerLayerEvent();
    }

    protected registerLayerEvent(): void {
        const _deviceLayer = this;
        if (this.options.showTooltipOnHover) { // 如果开启鼠标hover开关
            dojo.connect(this.layer, 'onMouseOver', function (evt: any) {
                _deviceLayer.onLayerMouseOver(_deviceLayer, evt);
            });
            dojo.connect(this.layer, 'onMouseOut', function (evt: any) {
                _deviceLayer.onLayerMouseOut(_deviceLayer, evt);
            });
        }
        dojo.connect(this.layer, 'onClick', function (evt: any) {
            _deviceLayer.onLayerClick(_deviceLayer, evt);
        });
    }

    protected onLayerMouseOver(deviceLayer: EgovaDeviceLayer, evt: any): void {
        deviceLayer.changeGraphicHover(evt.graphic, true);
    }

    protected onLayerMouseOut(deviceLayer: EgovaDeviceLayer, evt: any): void {
        deviceLayer.changeGraphicHover(evt.graphic, false);
    }

    protected onLayerClick(deviceLayer: EgovaDeviceLayer, evt: any): void {
        if (deviceLayer.options.showInfoWindowOnClick) {
            deviceLayer.showInfoWindow(evt.graphic);
        }
        if (deviceLayer.options.activeSelected) {
            if (evt.graphic.attributes.select) { // 如果当前已选，则置为未选
                MapUtils.changeSelectedState(evt.graphic, deviceLayer.getIconName(evt.graphic.attributes), false);
                // 触发onUnSelectInfo事件
                deviceLayer.options.onSelectChanged(false, evt.graphic.attributes, MapUtils.getSelectedGraphics(deviceLayer.layer));
            } else { // 如果未选，则置为已选
                if (!deviceLayer.options.isMultSelect) { // 如果选中资源需要清掉之前的已选
                    MapUtils.clearSelectedState(deviceLayer.layer, deviceLayer.getIconName(evt.graphic.attributes));
                }
                MapUtils.changeSelectedState(evt.graphic, deviceLayer.getIconName(evt.graphic.attributes), true);
                // 触发onSelectInfo事件
                deviceLayer.options.onSelectChanged(true, evt.graphic.attributes, MapUtils.getSelectedGraphics(deviceLayer.layer));
            }
        }
    }

    public abstract getInfoWindowContent(graphic: any): String;

    public abstract getInfoWindowTitle(graphic: any): String;

    private setInfoWindow(pt: any, title: String, content: any) {
        if (content) {
            this.egovaMap.infoWindow.setContent(content);
        }
        if (title) {
            this.egovaMap.infoWindow.setTitle(title);
        }
        this.egovaMap.infoWindow.show(pt);
    }

    public showInfoWindow(graphic: any) {

        if (graphic) {
            const content = this.getInfoWindowContent(graphic);
            const title = this.getInfoWindowTitle(graphic);
            const pt = this._getPoint(graphic.attributes);
            this.egovaMap.innerMap.centerAt(pt).then(this.setInfoWindow(pt, title, content));
        }
    }

    public hideInfowWindow() {
        this.egovaMap.infoWindow.hide();
    }


    public abstract onMapLoad(): void;



    /**
     * 变换成标准实体（最好子类重写）
     *
     * @protected
     * @param {*} item
     * @returns {{ id: String, name: String, longitude: number, latitude: number }}
     * @memberof EgovaDeviceLayer
     */
    protected changeStandardModel(item: any): { id: String, name: String, longitude: number, latitude: number } {
        if (item.tollLongitude && item.tollLatitude) {
            item.id = item.tollCode;
            item.name = item.tollName;
            item.longitude = item.tollLongitude;
            item.latitude = item.tollLatitude;
        }
        return item;
    }


    /**
     * 获取资源图标
     */
    protected getIconUrl(info: any): string {
        return MapUtils.getIconUrl(this.getIconName(info), info, false);
    }

    protected getIconName(item: any): string {
        return this.iconName;
    }


    /**
     * 创建点要素
     */
    protected _getPoint(item: any) {
        // 以longitude，latitude属性创建点
        if (MapUtils.validDevice(item)) {
            const firstPoint = new esri.geometry.Point(item.longitude, item.latitude, this.egovaMap.spatial);
            return firstPoint;
        } else {
            // 以x,y属性创建点
            return new esri.geometry.Point(item.x, item.y, this.egovaMap.spatial);
        }
    }

    protected getGraphicWidth(level?: number) {
        return this.egovaMap.getGraphicWidth(level);
    }
    protected getGraphicHeight(level?: number) {
        return this.egovaMap.getGraphicHeight(level);
    }
    /**
     * 鼠标移动至要素点的变化情况
     */
    protected changeGraphicHover(graphic: any, isHover: boolean = false) {
        const level = this.egovaMap.getHoverLevel(isHover);
        graphic.symbol.setWidth(this.getGraphicWidth(level)).setHeight(this.getGraphicHeight(level));
        graphic.draw();
    }

    /**
     * 增加资源点
     */
    protected _addGraphic(item: any, layer: any): any {
        layer = layer == null ? this.layer : layer;
        if (layer._map == null) {
            layer = this.egovaMap.innerMap.getLayer(layer.id);
        }
        item.select = false;
        const pt = this._getPoint(item);
        const graphic = new esri.Graphic(pt,
            new esri.symbols.PictureMarkerSymbol(
                this.getIconUrl(item),
                this.getGraphicWidth(),
                this.getGraphicHeight()), item);
        layer.add(graphic);
        return graphic;
    }


    /**
     * 加载数据,type表示数据类型如toll,
     *
     */
    public saveGraphicList(dataList: any[]) {
        const mp = new esri.geometry.Multipoint(this.egovaMap.spatial);

        for (let i = 0; i < dataList.length; i++) {
            const pt = this.saveGraphicByDevice(dataList[i]);
        }
    }

    public updateGraphicList(dataList: any[]) {
        const mp = new esri.geometry.Multipoint(this.egovaMap.spatial);

        for (let i = 0; i < dataList.length; i++) {
            const pt = this.updateGraphicByDevice(dataList[i]);
        }
    }


    /**
     * 加载数据,type表示数据类型如toll,
     *
     */
    public showDatas(dataList: any[], refresh: boolean = false) {
        const mp = new esri.geometry.Multipoint(this.egovaMap.spatial);

        for (let i = 0; i < dataList.length; i++) {
            const pt = this.addGraphicByDevice(dataList[i]);
            if (pt != null) {
                mp.addPoint(pt);
            }
        }

        if (refresh) {
            // 设置视界范围
            this.egovaMap.innerMap.setExtent(mp.getExtent(), false);
        }
    }

    /**
     * 切换选择状态
     */
    public switchlSelectStatus(dataList: any[], selected: boolean) {

        let layer = this.layer;
        if (layer._map == null) {
            layer = this.egovaMap.innerMap.getLayer(layer.id);
        }
        for (let i = 0; i < layer.graphics.length; i++) {
            const gg = layer.graphics[i];
            MapUtils.changeSelectedState(gg, this.getIconName(gg.attributes), !selected);
            for (let j = 0; j < dataList.length; j++) {
                const item = this.changeStandardModel(dataList[j]);
                if (this.getDeviceKey(gg.attributes) === this.getDeviceKey(item)) {
                    gg.attributes.select = selected;
                    MapUtils.changeSelectedState(gg, this.getIconName(gg.attributes), selected);
                    break;
                }
            }
        }
    }

    /**
     * 返回信息中的关键字值
     */
    public getDeviceKey(info: any): String {
        return info.id;
    }

    /**
     * 保存要素（如果存在，则修改，否则添加）
     */
    public saveGraphicByDevice(item: any) {
        const graphic = this.getGraphicById(item.id);
        if (graphic) {
            return this.updateGraphicByDevice(item, graphic);
        } else {
            return this.addGraphicByDevice(item);
        }
    }

    public addGraphicByDevice(item: any) {
        item = this.changeStandardModel(item);
        const pt = this._getPoint(item);
        const graphic = this.creatGraphicByDevice(item);
        if (MapUtils.isOnline(item)) {
            this.onlineGraphics.push(graphic);
        } else {
            this.offlineGraphics.push(graphic);
        }
        try {
            this.layer.add(graphic);
        } catch (ex) {

        }
        return pt;
    }

    public creatGraphicByDevice(item: any) {
        item = this.changeStandardModel(item);
        if (!MapUtils.validDevice(item)) {
            return null;
        }
        const pt = this._getPoint(item);
        item.select = false; // select属性为true表示当前选中，false表示未选中
        const iconUrl = this.getIconUrl(item);
        const width = this.getGraphicWidth();
        const height = this.getGraphicHeight();
        const graphic = new esri.Graphic(pt, new esri.symbol.PictureMarkerSymbol(
            iconUrl,
            width,
            height), item);
        return graphic;
    }

    /**
     * 修改要素
     */
    public updateGraphicByDevice(item: any, graphic?: any) {
        item = this.changeStandardModel(item);
        if (!MapUtils.validDevice(item)) {
            return;
        }
        if (!graphic) {
            graphic = this.getGraphicById(item.id);
        }
        if (graphic == null) {
            return;
        }

        const pt = this._getPoint(item);
        const iconUrl = this.getIconUrl(item);

        const startGeometry = graphic.geometry;
        const endGeometry = pt;

        graphic.setSymbol(new esri.symbols.PictureMarkerSymbol(
            iconUrl,
            this.getGraphicWidth(),
            this.getGraphicHeight()));
        graphic.setGeometry(pt);
        graphic.attributes = item;

        graphic.draw(); // 重绘

        this.updateOnlineGraphics(graphic, item);

        /**
         * 当位置发生变化则触发位置改变回调事件
         */
        if (!MapUtils.isEqualPoint(startGeometry, endGeometry)) {
            this.options.onPositionChanged([startGeometry, endGeometry], graphic);
        }
        return pt;
    }

    /**
     * 更新设备在线列表
     * @param graphic 地图graphic对象
     * @param device 设备信息
     */
    public updateOnlineGraphics(graphic: any, device: any) {
        let start = this.offlineGraphics.indexOf(graphic);
        if (start >= 0) {
            this.offlineGraphics.splice(start, 1);
        }
        start = this.onlineGraphics.indexOf(graphic);
        if (start >= 0) {
            this.onlineGraphics.splice(start, 1);
        }

        if (MapUtils.isOnline(device)) {
            this.onlineGraphics.push(graphic);
        } else {
            this.offlineGraphics.push(graphic);
        }
    }
}
