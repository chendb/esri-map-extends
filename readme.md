#安装
npm install

#编译
gulp

#发布
npm publish

#说明
该类库封闭了对arcgis二维地图常用操作，便于对gis知识不了解的开发人员实现复杂的地图相关业务逻辑。

使用示例：
1、构建地图对象
import {EgovaMap,EgovaMapOptions} from 'esri-map-extends';

let egvaMapOptions = new EgovaMapOptions(....);
let egovaMap=new EgovaMap("divMap",egvaMapOptions);
