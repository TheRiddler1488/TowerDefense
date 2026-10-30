import { _decorator, Component, Node, EventTouch, Vec3, UITransform } from 'cc';
import { GameManager } from '../Managers/GameManager';
import { Tower } from './Tower';
import { BuildSpot } from './BuildSpot';
import { PoolManager } from '../Managers/PoolManager';
import { EventBus, EventType, SFXType } from '../Core/EventBus';
const { ccclass } = _decorator;

@ccclass('TowerDrag')
export class TowerDrag extends Component {
    private tower: Tower = null!;
    private uiTransform: UITransform = null!;
    private originalSpot: BuildSpot | null = null;
    private isDragging: boolean = false;

    private startLocalPos: Vec3 = new Vec3();
    private static _tempLocalPos = new Vec3();

    onLoad() {
        this.tower = this.getComponent(Tower)!;
        this.uiTransform = this.getComponent(UITransform)!;

        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    private onTouchStart(event: EventTouch) {
        this.isDragging = true;
        this.startLocalPos.set(this.node.position);

        this.originalSpot = GameManager.instance.getClosestSpot(this.node.worldPosition, 10);
        this.node.setSiblingIndex(this.node.parent!.children.length - 1);

        GameManager.instance.enterBuildMode();
        this.updatePosition(event.getUILocation());
    }

    private onTouchMove(event: EventTouch) {
        if (!this.isDragging) return;
        this.updatePosition(event.getUILocation());
    }

    private onTouchEnd(event: EventTouch) {
        if (!this.isDragging) return;
        this.isDragging = false;

        GameManager.instance.exitBuildMode();

        const touchLoc = event.getUILocation();
        const worldPos = new Vec3(touchLoc.x, touchLoc.y, 0);
        const targetSpot = GameManager.instance.getClosestSpot(worldPos, 60);

        let success = false;

        if (targetSpot && targetSpot !== this.originalSpot) {
            if (targetSpot.isOccupied) {
                const targetTower = targetSpot.currentTower;

                if (targetTower && targetTower.level === this.tower.level && targetTower.level < 3) {
                    targetTower.mergeLevelUp();
                    if (this.originalSpot) this.originalSpot.occupy(null!);
                    PoolManager.instance.returnObject(this.node);
                    success = true;
                    EventBus.emit(EventType.PLAY_SFX, SFXType.MERGE);
                    EventBus.emit(EventType.TOWER_MERGED);
                }
            } else {
                if (this.originalSpot) this.originalSpot.occupy(null!);
                targetSpot.occupy(this.tower);

                const towersTransform = GameManager.instance.towersContainer.getComponent(UITransform);
                const localPos = towersTransform!.convertToNodeSpaceAR(targetSpot.node.worldPosition);
                this.node.setPosition(localPos);
                success = true;
            }
        }

        if (!success) {
            this.node.setPosition(this.startLocalPos);
        }
    }

    private updatePosition(uiLocation: any) {
        const towersTransform = GameManager.instance.towersContainer.getComponent(UITransform);
        if (towersTransform) {
            towersTransform.convertToNodeSpaceAR(new Vec3(uiLocation.x, uiLocation.y, 0), TowerDrag._tempLocalPos);
            this.node.setPosition(TowerDrag._tempLocalPos);
        }
    }
}
