import { _decorator, Component } from 'cc';
const { ccclass } = _decorator;

@ccclass('AdButton')
export class AdButton extends Component {
    public onClick() {
        const url = 'https://play.google.com/store/apps/details?id=your.game.package';

        if (typeof mraid !== 'undefined') {
            mraid.open(url);
        } else if (typeof window !== 'undefined' && typeof (window as any).ExitApi !== 'undefined') {
            (window as any).ExitApi.exit();
        } else {
            window.open(url);
        }
    }
}
