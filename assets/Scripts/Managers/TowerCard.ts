import { _decorator, Component, Node, EventTouch, Vec3, UITransform, Sprite, Prefab, Color } from 'cc';
import { GameManager } from '../Managers/GameManager';
import { Tower } from '../GamePlay/Tower';
import { PoolManager } from '../Managers/PoolManager';
import { EventBus, EventType, SFXType } from '../Core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('TowerCard')
export class TowerCard extends Component {
    @property(Prefab) public towerPrefab: Prefab = null!;
    @property(Node) public dragGhostNode: Node = null!;
    @property public cost: number = 50;

    private cardSprite: Sprite = null!;
    private isDragging: boolean = false;
    private uiTransform: UITransform = null!;
    private static _tempLocalPos = new Vec3();

    onLoad() {
        this.cardSprite = this.getComponent(Sprite)!;
        this.uiTransform = this.getComponent(UITransform)!;

        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    update() {
        if (!GameManager.instance) return;
        const canAfford = GameManager.instance.currency >= this.cost;

        this.cardSprite.color = canAfford ? new Color(255, 255, 255, 255) : new Color(100, 100, 100, 200);
    }

    private onTouchStart(event: EventTouch) {
        if (GameManager.instance.currency < this.cost) return;

        this.isDragging = true;
        GameManager.instance.enterBuildMode();

        if (this.dragGhostNode) {
            this.dragGhostNode.active = true;
            this.updateGhostPosition(event.getUILocation());
        }
    }

    private onTouchMove(event: EventTouch) {
        if (!this.isDragging) return;
        if (this.dragGhostNode) this.updateGhostPosition(event.getUILocation());
    }

    private onTouchEnd(event: EventTouch) {
        if (!this.isDragging) return;
        this.isDragging = false;

        GameManager.instance.exitBuildMode();
        if (this.dragGhostNode) this.dragGhostNode.active = false;

        const touchLoc = event.getUILocation();
        const worldPos = new Vec3(touchLoc.x, touchLoc.y, 0);
        const targetSpot = GameManager.instance.getClosestSpot(worldPos, 60);

        if (targetSpot) {
            if (!targetSpot.isOccupied) {
                GameManager.instance.spendCurrency(this.cost);
                const towerNode = PoolManager.instance.getObject(this.towerPrefab);
                GameManager.instance.towersContainer.addChild(towerNode);

                const towersTransform = GameManager.instance.towersContainer.getComponent(UITransform);
                const localPos = towersTransform!.convertToNodeSpaceAR(targetSpot.node.worldPosition);

                towerNode.setPosition(localPos);

                const tower = towerNode.getComponent(Tower);
                if (tower) {
                    tower.init(GameManager.instance.enemiesContainer);
                    targetSpot.occupy(tower);
                    EventBus.emit(EventType.PLAY_SFX, SFXType.BUILD);
                    EventBus.emit(EventType.TOWER_BUILT, targetSpot.node.worldPosition);
                }
            }
        }
    }
    private updateGhostPosition(uiLocation: any) {
        this.uiTransform.convertToNodeSpaceAR(new Vec3(uiLocation.x, uiLocation.y, 0), TowerCard._tempLocalPos);
        this.dragGhostNode.setPosition(TowerCard._tempLocalPos);
    }
}
