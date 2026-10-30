import { _decorator, Component, Vec3, tween, Node, UITransform } from 'cc';
import { PoolManager } from '../Managers/PoolManager';
import { GameManager } from '../Managers/GameManager';
import { EventBus, EventType, SFXType } from '../Core/EventBus';
const { ccclass } = _decorator;

@ccclass('Coin')
export class Coin extends Component {
    private coinValue: number = 15;

    public drop(startPos: Vec3, targetUIWorldPos: Vec3) {
        this.node.setPosition(startPos);
        this.node.setScale(0, 0, 1);

        const parentTransform = this.node.parent!.getComponent(UITransform)!;
        const targetLocalPos = parentTransform.convertToNodeSpaceAR(targetUIWorldPos);

        const jumpOffsetX = (Math.random() - 0.5) * 40;
        const jumpPos = new Vec3(startPos.x + jumpOffsetX, startPos.y + 40, 0);

        tween(this.node)
            .to(0.2, { scale: new Vec3(1, 1, 1), position: jumpPos }, { easing: 'quadOut' })
            .delay(0.1)
            .to(0.4, { position: targetLocalPos }, { easing: 'quadIn' })
            .call(() => {
                GameManager.instance.addCurrency(this.coinValue);
                EventBus.emit(EventType.PLAY_SFX, SFXType.COIN);
                PoolManager.instance.returnObject(this.node);
            })
            .start();
    }
}
