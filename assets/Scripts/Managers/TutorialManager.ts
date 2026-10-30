import { _decorator, Component, Node, EventTouch, Vec3, tween, UITransform, Tween } from 'cc';
import { EventBus, EventType } from '../Core/EventBus';
import { GameState } from '../Core/GameState';
const { ccclass, property } = _decorator;

@ccclass('TutorialManager')
export class TutorialManager extends Component {
    @property(Node) startHandUI: Node = null!;
    @property(Node) mergeHandUI: Node = null!;

    private towerPositions: Vec3[] = [];
    private mergeTween: Tween<Node> | null = null;

    protected onLoad() {
        this.node.on(Node.EventType.TOUCH_START, this.onFirstTouch, this);
        EventBus.on(EventType.TOWER_BUILT, this.onTowerBuilt, this);
        EventBus.on(EventType.TOWER_MERGED, this.endMergeTutorial, this);

        this.startHandUI.active = true;
        this.mergeHandUI.active = false;
        GameState.isStarted = false;
        GameState.isPaused = false;
    }

    private onFirstTouch(event: EventTouch) {
        if (GameState.isStarted) return;

        GameState.isStarted = true;
        this.startHandUI.active = false;
        EventBus.emit(EventType.GAME_START);
    }

    private onTowerBuilt(worldPos: Vec3) {
        GameState.towersCount++;
        this.towerPositions.push(worldPos.clone());

        if (GameState.towersCount === 2 && !GameState.hasSeenMergeTutorial) {
            this.startMergeTutorial();
        }
    }

    private startMergeTutorial() {
        GameState.hasSeenMergeTutorial = true;
        GameState.isPaused = true;
        this.mergeHandUI.active = true;
        EventBus.emit(EventType.GAME_PAUSE);

        const uiTransform = this.node.getComponent(UITransform);
        if (!uiTransform) {
            console.error('TutorialManager должен иметь компонент UITransform!');
            return;
        }

        const startPos = uiTransform.convertToNodeSpaceAR(this.towerPositions[0]);
        const endPos = uiTransform.convertToNodeSpaceAR(this.towerPositions[1]);

        this.mergeTween = tween(this.mergeHandUI)
            .call(() => {
                this.mergeHandUI.setPosition(startPos);
                this.mergeHandUI.setScale(new Vec3(1.2, 1.2, 1));
            })
            .to(0.2, { scale: new Vec3(1, 1, 1) })
            .to(0.8, { position: endPos }, { easing: 'sineInOut' })
            .to(0.2, { scale: new Vec3(1.2, 1.2, 1) })
            .delay(0.2)
            .union()
            .repeatForever()
            .start();
    }

    private endMergeTutorial() {
        GameState.towersCount--;
        this.towerPositions = [];

        if (this.mergeHandUI.active) {
            if (this.mergeTween) {
                this.mergeTween.stop();
                this.mergeTween = null;
            }
            this.mergeHandUI.active = false;
            GameState.isPaused = false;
            EventBus.emit(EventType.GAME_RESUME);
        }
    }
}
