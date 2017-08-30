import { TrackLine, TrackSegment, TrackSegmentOptions } from './egova-track.model'
import { EgovaFeatureLayer, EgovaGroupLayer } from './egova.layer';
import { EgovaMap } from './egova.map';
import { MapUtils } from './map.utils';

declare var esri: any;
declare var dojo: any;

export class EgovaMapRouteOptions {

    public lineStartEvent: Function;

    public lineEndEvent: Function;

    public moveEvent: Function;

    public stationEvent: Function;


    constructor(public routeUrl: string, public routeType: string) {

    }

    public onLineStartEvent(lineName: string, segmentIndex: number, trackLine: TrackLine | undefined): void {
        if (this.lineStartEvent) {
            this.lineStartEvent({
                lineName: lineName,
                segmentIndex: segmentIndex,
                trackline: trackLine
            });
        }
    }

    public onLineEndEvent(lineName: string, segmentIndex: number, trackLine: TrackLine | undefined): void {
        if (this.lineEndEvent) {
            this.lineEndEvent({
                lineName: lineName,
                segmentIndex: segmentIndex,
                trackline: trackLine
            });
        }
    }

    public onMoveEvent(lineName: string, segmentIndex: number, xy: any[], angle: number): any {
        if (this.moveEvent) {
            this.moveEvent({
                lineName: lineName,
                segmentIndex: segmentIndex,
                xy: xy,
                angle: angle
            });
        }
    }

    public onStationEvent(lineName: string, segmentIndex: number, graphic: any, enter: boolean, trackLine: TrackLine | undefined): void {
        if (this.moveEvent) {
            this.moveEvent({
                lineName: lineName,
                segmentIndex: segmentIndex,
                graphic: graphic,
                enter: enter,
                trackLine: trackLine
            });
        }
    }

}

export class EgovaMapRoute {

    public moveLineLayer: any;
    public moveMarkLayer: any;
    public moveLabelLayer: EgovaGroupLayer;
    public trackLines: TrackLine[] = [];

    constructor(public egovaMap: EgovaMap
        , public layerName: string
        , public options: EgovaMapRouteOptions) {


        // 轨迹线路
        this.moveLineLayer = new esri.layers.GraphicsLayer({
            id: layerName + "LineLayer"
        });
        // 移动小车
        this.moveMarkLayer = new esri.layers.GraphicsLayer({
            id: layerName + "MarkerLayer"
        });

        // 移动的小车车牌
        this.moveLabelLayer = new EgovaGroupLayer(layerName + "LabelLayer");

        this.moveLineLayer = this.egovaMap.innerMap.addLayer(this.moveLineLayer);
        this.moveMarkLayer = this.egovaMap.innerMap.addLayer(this.moveMarkLayer)
        this.egovaMap.innerMap.addLayer(this.moveLabelLayer.layer);

        const _this = this;
        // 当地图已经加载时直接执行_onLoad方法
        if (this.egovaMap.innerMap.loaded) {
            _this.onLoad();
        } else {
            this.egovaMap.innerMap.on("load", function () {
                _this.onLoad();
            });
        }
    }

    private onLoad(): void {

    }

    /*********************轨迹线路**************************/


    /**
    * 获取指定名称的线路
    */
    public getTrackLine(name: string): TrackLine | undefined {
        return this.trackLines.find(g => g.name == name);
    }

    /**
     * 向指定线路中增加路段
     */
    public addTrackSegment(name: string, segment: TrackSegment, lineOptions: any): void {
        var trackline = this.getTrackLine(name);
        if (!trackline) {
            trackline = new TrackLine(name
                , lineOptions.markerUrl
                , lineOptions.markerLabel
                , lineOptions.markerHeight
                , lineOptions.markerWidth);
            this.trackLines.push(trackline);
        }
        trackline.add(segment);
    }

    /**
     * 计算线路的下一个路段索引
     */
    public getNextSegmentIndex(name: string): number {
        var trackline = this.getTrackLine(name);
        if (trackline) return trackline.nextSegmentIndex;
        return 0;
    }

    /**
     * 获取线路的下一路段
     */
    public getNextSegment(name: string, index: number): TrackSegment | undefined {
        var trackline = this.getTrackLine(name);
        if (trackline) return trackline.getNextSegment(index);
        return undefined;
    }

    /**
     * 获取线路中的最后一路段
     */
    public getLastSegment(name: string): TrackSegment | undefined {
        var trackline = this.getTrackLine(name);
        if (trackline) return trackline.lastSegment;
        return undefined;
    }

    /**
     * 获取监控最近播放完成的路段线路
     */
    public getActiveCompletedSegment(name: string): TrackSegment | undefined {
        var trackline = this.getTrackLine(name);
        if (trackline) return trackline.activeCompletedSegment;
        return undefined;
    }

    /**
     * 判断线路是否在运行
     */
    public getIsRunning(name: string): boolean {
        var trackline = this.getTrackLine(name);
        if (trackline)
            return trackline.isRunning;
        else
            return false;
    }

    /*********************轨迹线路**************************/

    /*********************播放控制**************************/

    /**
      * 停止
      */
    public stop(name: string): void {
        var trackline = this.getTrackLine(name);
        if (trackline != null) {
            trackline.stop();
        }
    }
    /**
     * 启动线路播放（起点为上次播放的终点）
     */
    public move(name: string): void {
        var trackline = this.getTrackLine(name);
        if (trackline) trackline.move();
    }
    /**
     * 启动线路播放（起点为线路的始点）
     */
    public start(name: string): void {
        var trackline = this.getTrackLine(name);
        if (trackline) {
            trackline.stop();
            trackline.start();
        }
    }
    /**
     * 暂停
     */
    public pause(name: string): void {
        var trackline = this.getTrackLine(name);
        if (trackline)
            trackline.pause();
    }

    /**
     * 继续
     */
    public continue(name: string): void {
        var trackline = this.getTrackLine(name);
        if (trackline)
            trackline.continue();
    }
    /**
     * 调速
     */
    public changeSpeed(name: string, speed: number) {
        var trackline = this.getTrackLine(name);
        if (trackline) {
            trackline.changeSpeed(speed);
        }
    }
    public clear(name: string) {
        if (!name) {
            console.error("没有指定清除的线路名称");
            return;
        }
        var trackline = this.getTrackLine(name);
        if (trackline == null) return;
        trackline.stop();


        var markerGraphics = this.moveMarkLayer.graphics;
        for (var i = 0; i < markerGraphics.length; i++) {
            var g = markerGraphics[i];
            if (g.attributes.line == name) {
                this.moveMarkLayer.remove(g);
                i--;
            }
        }

        this.moveLabelLayer.removeGraphicByName(name);

        var lineGraphics = this.moveLineLayer.graphics;
        for (var i = 0; i < lineGraphics.length; i++) {
            var g = lineGraphics[i];
            if (g.attributes.line == name) {
                this.moveLineLayer.remove(g);
                i--;
            }
        }
        trackline.markerLabelGraphic = null;
        trackline.markerGraphic = null;

    }

    public clearLine(name: string) {
        if (!name) {
            console.error("没有指定清除的线路名称");
            return;
        }
        var trackline = this.getTrackLine(name);

        var lineGraphics = this.moveLineLayer.graphics;
        for (var i = 0; i < lineGraphics.length; i++) {
            var g = lineGraphics[i];
            if (g.attributes.line == name) {
                this.moveLineLayer.remove(g);
                i--;
            }
        }

    }
    /**
     * 清除所有
     */
    public clearAll() {
        this.checkMapSetting();
        for (var i = 0; i < this.trackLines.length; i++) {
            var trackline = this.trackLines[i];
            trackline.stop();
            trackline.reset();
        }
        this.trackLines = [];
        if (this.moveMarkLayer._map != null)
            this.moveMarkLayer.clear();

        if (this.moveLabelLayer._map != null)
            this.moveLabelLayer.clear();

        if (this.moveLineLayer._map != null)
            this.moveLineLayer.clear();
    }

    /*********************播放控制**************************/


    /**
     * 求解最短路径（与solve不同，它求解的是一个路段，该路段起点为stops[0],终点为stops[stops.length-1]
     *
     * @param {any} name  线路名称
     * @param {any} stops 经过的站点
     * @param {any} options 可选参数
     */
    public solveSegment(name: string, stops: any[], options: TrackSegmentOptions) {
        this.checkMapSetting();

        if (stops.length < 1) {
            throw Error("经过的站点不能少于2");
        }

        const stopSymbol = new esri.symbols.SimpleMarkerSymbol()
            .setStyle(esri.symbols.SimpleMarkerSymbol.STYLE_CROSS)
            .setSize(15).outline.setWidth(3);

        const stopGraphics = this.getStandardStops(name, stops, stopSymbol);

        const segment = this.getLastSegment(name);
        let startLineIndex = segment ? segment.index + 1 : 0;
        if (segment) {
            const isEqual = MapUtils.isEqualPoint(segment.endGraphic.geometry, stopGraphics[0].geometry);
            const isNA = this.options.routeType == "NA";
            // 若是网络分析服务且新增的路段与前一路段没有对接上，则增加一个路段用于连接他们
            if (isNA && !isEqual) {
                this.post(startLineIndex, name, segment.endGraphic, stopGraphics[0], options);
                startLineIndex += 1;
            }
        }
        const start = stopGraphics.splice(0, 1)[0];// 从数组中取出第一个
        const end = stopGraphics.splice(stopGraphics.length - 1, 1)[0];// 从数组中取出最后一个
        const waypoints = stopGraphics; //
        this.post(startLineIndex, name, start, end, options, waypoints);

    }


    /**
     * 发送路由请求
     * @ index:路段索引
     * @ name:线路名称
     * @ start:开始要素
     * @ end:终点要素
     * @ lineOptions:线路控制的参数
     * @ waypoints:经过的点
     */
    private post(index: number, name: string, start: any, end: any, lineOptions: TrackSegmentOptions, waypoints?: any[]) {

        const egovaMapRoute = this;

        const trackSegmentOptions = new TrackSegmentOptions(lineOptions.numsOfKilometer, lineOptions.speed, lineOptions.autoShowLine);

        trackSegmentOptions.showSegmentLineEvent = function (segment: TrackSegment) {
            egovaMapRoute.onShowSegmentLineEvent(egovaMapRoute, segment, lineOptions);
        }
        trackSegmentOptions.moveStartEvent = function (segment: TrackSegment, graphic: any, angle: number) {
            egovaMapRoute.onMoveStartEvent(egovaMapRoute, segment, graphic, angle);
        }
        trackSegmentOptions.moveEvent = function (segment: TrackSegment, point: any, angle: number) {
            egovaMapRoute.onMoveEvent(egovaMapRoute, segment, point, angle);
        }
        trackSegmentOptions.moveEndEvent = function (segment: TrackSegment, graphic: any, angle: number) {
            egovaMapRoute.onMoveEndEvent(egovaMapRoute, segment, graphic, angle);
        }

        const segment = new TrackSegment(index, name, start, end, trackSegmentOptions);

        if (waypoints) {
            segment.waypoints = waypoints;
        }

        this.addTrackSegment(name, segment, lineOptions);

        if (this.options.routeType == "NA") {
            this.solveByNA(segment, start, end, waypoints);
        } else {
            this.solveByJoinPoint(segment);
        }

    }


    /**
     * 由网络分析服务来求解轨迹并播放
     * 
     * @param {TrackSegment} segment 要播放的路段
     * @param {*} start 起点要素
     * @param {*} end 终点要素
     * @param {any[]} [waypoints] 途经要素点
     * @memberof EgovaMapRoute
     */
    private solveByNA(segment: TrackSegment, start: any, end: any, waypoints?: any[]) {
        const routeTask = new esri.tasks.RouteTask(this.options.routeUrl);
        const routeParams = new esri.tasks.RouteParameters();
        routeParams.stops = new esri.tasks.FeatureSet();
        routeParams.returnRoutes = true;
        routeParams.returnDirections = true;
        routeParams.directionsLengthUnits = esri.Units.MILES;
        routeParams.outSpatialReference = new esri.SpatialReference({ wkid: this.egovaMap.spatial.wkid });

        const egovaMapRoute = this;
        routeTask.on("solve-complete", function (evt: any) {
            egovaMapRoute.solveComplete(egovaMapRoute, evt, segment);
        });
        routeTask.on("error", function (err: any) {
            egovaMapRoute.errorHandler(egovaMapRoute, err, segment);
        });
        // 起点
        routeParams.stops.features.push(this.cloneStopGraphic(start));

        // 途径点
        if (waypoints) {
            for (var i = 0; i < waypoints.length; i++) {
                routeParams.stops.features.push(this.cloneStopGraphic(waypoints[i]));
            }
        }
        // 终点
        routeParams.stops.features.push(this.cloneStopGraphic(end));
        routeTask.solve(routeParams);
    }

    /**
     * 由连线求解轨迹
     * @param segment
     */
    private solveByJoinPoint(segment: TrackSegment) {
        const points = [];
        points.push(segment.startGraphic.geometry);
        if (segment.waypoints) {
            for (var i = 0; i < segment.waypoints.length; i++) {
                points.push(segment.waypoints[i].geometry);
            }
        }
        points.push(segment.endGraphic.geometry);
        //当路由分析出错时，两点之间的最短路径以直线代替
        segment.setLine(points, this.egovaMap.spatial);
    }


    /**
     * 路由分析完成回调
     */
    private solveComplete(mapRoute: EgovaMapRoute, evt: any, segment: TrackSegment) {
        const routeResult = evt.result.routeResults[0];
        const polyline = routeResult.route.geometry;
        const length = routeResult.directions.totalLength;
        // 设置路段播放线路信息
        segment.setPolyLine(polyline, length);
    }

    /**
     * 路由分析失败回调
     */
    private errorHandler(mapRoute: EgovaMapRoute, err: any, segment: TrackSegment) {
        console.log("路由分析异常" + err + "");
        const points = [];
        points.push(segment.startGraphic.geometry);
        if (segment.waypoints) {
            for (let i = 0; i < segment.waypoints.length; i++) {
                points.push(segment.waypoints[i].geometry);
            }
        }
        points.push(segment.endGraphic.geometry);
        //当路由分析出错时，两点之间的最短路径以直线代替
        segment.setLine(points, mapRoute.egovaMap.spatial);
    }



    // 检测地图设置，防止图层未加载到地图上
    protected checkMapSetting() {
        if (this.moveMarkLayer._map == null) {
            this.moveMarkLayer = this.egovaMap.innerMap.getLayer(this.moveMarkLayer.id);
        }
        if (this.moveLabelLayer._map == null) {
            this.moveLabelLayer = this.egovaMap.innerMap.getLayer(this.moveLabelLayer.id);
        }
        if (this.moveLineLayer._map == null) {
            this.moveLineLayer = this.egovaMap.innerMap.getLayer(this.moveLineLayer.id);
        }
    }


    /**
     * 每次位置移动线路上的要素样式变换操作
     */
    public changeMovingGraphicSymbol(trackline: TrackLine | undefined, point: any, angle: number) {
        if (trackline == undefined) return;
        var symbol = trackline.markerGraphic.symbol;
        symbol.setAngle(360 - angle);
        trackline.markerGraphic.setSymbol(symbol);
        trackline.markerGraphic.setGeometry(point);
        trackline.markerGraphic.draw();//重绘

        if (trackline.markerLabelGraphic) {
            trackline.markerLabelGraphic.setGeometry(point);
            trackline.markerLabelGraphic.draw();
        }
    }

    protected showSegmentLine(segment: TrackSegment) {
        var playedLineSymbol = new esri.symbols.CartographicLineSymbol(
            esri.symbols.CartographicLineSymbol.STYLE_SOLID, new esri.Color([38, 101, 196, 0.5]), 2,
            esri.symbols.CartographicLineSymbol.CAP_ROUND,
            esri.symbols.CartographicLineSymbol.JOIN_MITER, 2);

        segment.lineGraphic = new esri.Graphic(segment.polyline, playedLineSymbol, {
            type: "segment",
            line: segment.name
        });
        this.moveLineLayer.add(segment.lineGraphic);
    }

    /**
     * 
     * 显示路段事件
     * 
     * @protected
     * @memberof EgovaMapRoute
     */
    protected onShowSegmentLineEvent(egovaMapRoute: EgovaMapRoute, segment: TrackSegment, lineOptions: any) {
        // 是否自动显示轨迹
        if (lineOptions.autoShowSegmentLine) {
            if (!segment.lineGraphic) {
                egovaMapRoute.showSegmentLine(segment);
            }
        }
        if (lineOptions.onShowSegmentLineEvent) {
            lineOptions.onShowSegmentLineEvent(segment);
        }
    }

    /**
     * 线段播放开始事故
     */
    protected onMoveStartEvent(egovaMapRoute: EgovaMapRoute, segment: TrackSegment, graphic: any, angle: number) {
        var trackline = egovaMapRoute.getTrackLine(segment.name);

        if (trackline == undefined) {
            return;
        }

        if (!trackline.markerGraphic) {
            var mg = egovaMapRoute.getMarkerGraphic(trackline, graphic, angle);
            trackline.markerGraphic = mg;
            egovaMapRoute.moveMarkLayer.add(mg);

            if (trackline.markerLabel) {
                var text = egovaMapRoute.getMarkerLabelGraphic(trackline, graphic, angle);
                var bg = egovaMapRoute.getMarkerLabelBackGroundGraphic(trackline, graphic, angle);
                trackline.markerLabelGraphic = text;
                egovaMapRoute.moveLabelLayer.addGraphice(trackline.name, [text, bg]);
            }
        }
        egovaMapRoute.egovaMap.centerAt(graphic.geometry.x, graphic.geometry.y);

        if (!segment.lineGraphic) {
            egovaMapRoute.showSegmentLine(segment);
        }


        egovaMapRoute.options.onStationEvent(segment.name, segment.index, graphic, true, egovaMapRoute.getTrackLine(segment.name));
        if (segment.index == 0) {
            // 线路播放开始事故回调
            this.options.onLineStartEvent(segment.name, segment.index, egovaMapRoute.getTrackLine(segment.name));
        }
    }

    /**
     * 线段播放完成事件
     */
    protected onMoveEndEvent(egovaMapRoute: EgovaMapRoute, segment: TrackSegment, graphic: any, angle: number) {
        const nextSegment = egovaMapRoute.getNextSegment(segment.name, segment.index);
        const currentLine = egovaMapRoute.getTrackLine(segment.name);
        if (nextSegment) {
            egovaMapRoute.options.onStationEvent(segment.name, segment.index, graphic, false, currentLine);
            // 到达站点
            nextSegment.start();
        } else {
            egovaMapRoute.options.onStationEvent(segment.name, segment.index, graphic, false, currentLine);
            segment.stop();
            // 如果没有下一条线路，说明线路播放结束，此时调用线路播放结束回调
            egovaMapRoute.options.onLineEndEvent(segment.name, segment.index, currentLine);
        }
    }
    /**
     * 移动回调事件
     */
    protected onMoveEvent(egovaMapRoute: EgovaMapRoute, segment: TrackSegment, xy: any[], angle: number) {
        var point = new esri.geometry.Point(parseFloat(xy[0]), parseFloat(xy[1]), egovaMapRoute.egovaMap.spatial)
        var trackline = egovaMapRoute.getTrackLine(segment.name);
        egovaMapRoute.changeMovingGraphicSymbol(trackline, point, angle);

        egovaMapRoute.options.onMoveEvent(segment.name, segment.index, xy, angle);
    }

    public cloneStopGraphic(graphic: any) {
        return new esri.Graphic(
            graphic.geometry,
            graphic.symbol, {
                type: graphic.attributes.type,
                line: graphic.attributes.line
            }
        );
    }

    /**
     * 标准化停靠点
     */
    private getStandardStops(name: string, stops: any[], stopSymbol: any) {
        const stopGraphics = [];
        for (let i = 0; i < stops.length; i++) {
            if (stops[i] instanceof Array) {
                stopGraphics.push(new esri.Graphic(
                    new esri.geometry.Point(stops[i][0], stops[i][1]),
                    stopSymbol, { type: "stop", line: name }
                ));
            }
            else if ((stops[i].declaredClass || "").indexOf("Point") > 0) {
                stopGraphics.push(new esri.Graphic(
                    stops[i],
                    stopSymbol, { type: "stop", line: name }
                ));
            } else {
                stopGraphics.push(new esri.Graphic(
                    stops[i].geometry,
                    stopSymbol, { type: "stop", model: stops[i].attributes, line: name }
                ));
            }
        }
        return stopGraphics;
    }


    /**
     * 线路上移动要素的构建（子）
     */
    public getMarkerGraphic(trackline: TrackLine, graphic: any, angle: number) {
        var markerUrl = trackline.markerUrl;
        var markerHeight = trackline.markerHeight || 48;
        var markerWidth = trackline.markerWidth || 48;
        var symbol = new esri.symbols.PictureMarkerSymbol(markerUrl, markerHeight, markerWidth);
        return new esri.Graphic(graphic.geometry, symbol, { type: "marker", line: trackline.name });
    }

    /**
     * 线路上移动要素的上方label构建
     */
    public getMarkerLabelGraphic(trackline: TrackLine, graphic: any, angle: number) {
        var text = new esri.symbol.TextSymbol(trackline.markerLabel);
        var font = new esri.symbol.Font();
        font.setSize("10pt");
        font.setFamily("微软雅黑");
        text.setFont(font);
        text.setColor(new esri.Color([255, 255, 255, 100]));
        text.setOffset(0, 40);
        return new esri.Graphic(graphic.geometry, text);
    }

    public getMarkerLabelBackGroundGraphic(trackline: TrackLine, graphic: any, angle: number) {

        return null;
    }

}