/**
 * 地图配置
 *
 * @export
 * @class MapSetting
 */

export class MapSetting {
    public static arcgisApi: String = '//js.arcgis.com/3.18/';
    public static baseUrl: String = 'http://27.17.34.21:8399/arcgis/rest/services/stdcgvrmap/MapServer'; // 瓦片图层服务

    public static wkid = 2379;
    public static level = 3; // 初始等级
    public static center: String;
    public static autoResize: true;

    public static offSize = 3; // 图标宽小于高的差值
    public static graphicHoverLevel = 2; // 鼠标移动到卡口时卡口的放大等级
    public static graphicBaseSize = 25; // 地图level为0时的卡口图标大小，每高一个级别加tollSizeFactor的大小
    public static graphicSizeFactor = 2; // 地图每级图标大小的增量
    public static pointIcon: String = 'assets/map/pointIcon.png';
    public static panToIcon: String = 'assets/map/panto.gif';
    public static logo: Boolean = false; // 是否显示logo
    public static slider: Boolean = false; // 是否显示放大缩小按钮
    public static baseLayerBox: Boolean = true; // 是否显示地图类型切换工具条

}

/**
 * 设备图标格式配置
 *
 * @export
 * @class DveiceIconSetting
 */
export class DveiceIconSetting {
    public static onlineUnSelectIcon: String = 'assets/map/icon/{0}On.png';
    public static onlineSelectIcon: String = 'assets/map/icon/{0}OnCho.png';
    public static offlineUnSelectIcon: String = 'assets/map/icon/{0}Off.png';
    public static offlineSelectIcon: String = 'assets/map/icon/{0}OffCho.png';
}
