import { _decorator, Component, Sprite } from 'cc';
import { Tower } from '../GamePlay/Tower';
const { ccclass, property } = _decorator;

@ccclass('BuildSpot')
export class BuildSpot extends Component {
    @property(Sprite) public highlightSprite: Sprite = null!;

    public currentTower: Tower | null = null;

    public get isOccupied(): boolean {
        return this.currentTower !== null;
    }

    public occupy(tower: Tower) {
        this.currentTower = tower;
    }

    public setHighlight(visible: boolean) {
        if (this.isOccupied) return;
        if (this.highlightSprite) {
            this.highlightSprite.node.active = visible;
        }
    }
}
