import { DveiceIconSetting } from '../map.setting';

export class MapUtils {

    /**
     * 判断原始点坐标与目标点坐标是否一样
     *
     * @static
     * @param {*} originGeometry 原始点
     * @param {*} targetGeometry 要比较的目标点
     * @returns {boolean} true:一样,false:不一样
     * @memberof MapUtils
     */
    public static isEqualPoint(originGeometry: any, targetGeometry: any): boolean {
        if ((originGeometry != null) || (targetGeometry != null)) {
            return false;
        }
        return originGeometry.x === targetGeometry.x && originGeometry.y === targetGeometry.y;
    }

    /**
     * 验证是否包涵经纬度
     */
    public static validDevice(device: any) {
        return device.latitude && device.longitude;
    }

    /**
     * 是否为在线状态
     *
     * @static
     * @param {any} device 设备信息
     * @returns {boolean} 是否在线
     * @memberof MapUtils
     */
    public static isOnline(device: any): boolean {
        if (device.status && device.status === '0') {
            return false;
        }
        if (device.onlineFlag && device.onlineFlag === '0') {
            return false;
        }
        return true;
    }

    /**
     * 根据设备不同状态获取对应的图标地址
     *
     * @static
     * @param {any} iconName 图标名称
     * @param {any} device 设备信息
     * @param {any} selected 是否选种
     * @returns {String} 图标相关站点的地址
     * @memberof MapUtils
     */
    public static getIconUrl(iconName: string, device: any, selected: boolean = false): string {
        let iconUrl = '';
        selected = selected === undefined ? device.select : selected;
        if (selected) {
            iconUrl = DveiceIconSetting.onlineSelectIcon.replace('{0}', iconName);
            if (!this.isOnline(device)) {
                iconUrl = DveiceIconSetting.offlineSelectIcon.replace('{0}', iconName);
            }
        } else {
            iconUrl = DveiceIconSetting.onlineUnSelectIcon.replace('{0}', iconName);
            if (!this.isOnline(device)) {
                iconUrl = DveiceIconSetting.offlineUnSelectIcon.replace('{0}', iconName);
            }
        }
        return iconUrl;
    }


    /**
     * 设备graphic选择状态
     *
     * @static
     * @param {*} graphic 地图graphic对象
     * @param {String} iconName 图标名称(如卡口对应为:toll)
     * @param {boolean} selected 是否选种
     * @memberof MapUtils
     */
    public static changeSelectedState(graphic: any, iconName: string, selected: boolean): void {
        const iconUrl = this.getIconUrl(iconName, graphic.attributes, selected);
        graphic.symbol.setUrl(iconUrl);
        graphic.draw();
        graphic.attributes.select = selected;
    }

    public static clearSelectedState(layer: any, iconName: string) {
        (<any[]>layer.graphics).forEach(g => {
            this.changeSelectedState(g, iconName, false);
        });
    }

    public static getSelectedGraphics(layer: any): any[] {
        const items = (<any[]>layer.graphics).filter(g => g.attributes.select === true);
        return items;
    }


    /**
     * 获取角度的方法
     */
    public static getAngle(pt1: { x: number, y: number }, pt2: { x: number, y: number }): number {
        let x1 = pt1.x, y1 = pt1.y;
        let x2 = pt2.x, y2 = pt2.y;
        let x = x2 - x1, y = y2 - y1;
        //第一象限
        if (x > 0 && y >= 0) {
            return Math.round((Math.atan(y / x) / Math.PI * 180));
        }
        //第四象限
        else if (x > 0 && y < 0) {
            return 360 + Math.round((Math.atan(y / x) / Math.PI * 180));
        }
        //第二象限
        else if (x < 0 && y >= 0) {
            return 180 + Math.round((Math.atan(y / x) / Math.PI * 180));
        }
        //第三象限
        else if (x < 0 && y < 0) {
            return 180 + Math.round((Math.atan(y / x) / Math.PI * 180));
        }
        else if (x == 0) {
            return 90;
        }
        return 0;
    }

}
