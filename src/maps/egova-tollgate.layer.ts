import { EgovaDeviceLayer } from './egova-device.layer';

export class EgovaTollgateLayer extends EgovaDeviceLayer {
    public getInfoWindowContent(graphic: any): string {
        return '<div>这是一个卡口点位信息</div>';
    }
    public getInfoWindowTitle(graphic: any): string {
        return '这是标题';
    }

    protected getIconName(item: any): string {
        return 'toll';
    }

    protected changeStandardModel(item: any) {
        return super.changeStandardModel(item);
    }

    public onMapLoad(): void {

    }
}
