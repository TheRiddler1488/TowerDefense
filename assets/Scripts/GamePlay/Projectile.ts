import { _decorator, Component, Vec3, Quat, Sprite, SpriteFrame } from 'cc';
import { Enemy } from './Enemy';
import { PoolManager } from '../Managers/PoolManager';
import { DamageType } from './Tower';
import { GameState } from '../Core/GameState';
import { EventBus, EventType, SFXType } from '../Core/EventBus';

const { ccclass, property } = _decorator;
const RAD_TO_DEG = 180 / Math.PI;

@ccclass('Projectile')
export class Projectile extends Component {
    @property(Sprite) public sprite: Sprite = null!;
    @property([SpriteFrame]) public projectileFrames: SpriteFrame[] = [];

    private target: Enemy | null = null;
    private speed: number = 600;
    private damage: number = 0;
    private damageType: DamageType = DamageType.NORMAL;

    private static _tempDir = new Vec3();
    private static _tempQuat = new Quat();

    public init(target: Enemy, damage: number, type: DamageType) {
        this.target = target;
        this.damage = damage;
        this.damageType = type;

        if (this.sprite && this.projectileFrames[type]) {
            this.sprite.spriteFrame = this.projectileFrames[type];
        }
    }

    update(deltaTime: number) {
        if (GameState.isPaused) return;

        if (!this.target || !this.target.node.active) {
            PoolManager.instance.returnObject(this.node);
            return;
        }

        const targetPos = this.target.node.worldPosition;
        const currentPos = this.node.worldPosition;

        Vec3.subtract(Projectile._tempDir, targetPos, currentPos);
        const distance = Projectile._tempDir.length();

        if (distance < 25) {
            this.target.takeDamage(this.damage);

            if (this.damageType === DamageType.ICE) {
                this.target.applyFreeze(2.0);
            } else if (this.damageType === DamageType.FIRE) {
                this.target.applyBurn(3.0);
            }

            const sfx = this.damageType === DamageType.NORMAL ? SFXType.HIT_NORMAL : this.damageType === DamageType.ICE ? SFXType.HIT_ICE : SFXType.HIT_FIRE;
            EventBus.emit(EventType.PLAY_SFX, sfx);

            PoolManager.instance.returnObject(this.node);
        } else {
            Projectile._tempDir.normalize();
            const angle = Math.atan2(Projectile._tempDir.y, Projectile._tempDir.x) * RAD_TO_DEG;
            Quat.fromEuler(Projectile._tempQuat, 0, 0, angle);
            this.node.setRotation(Projectile._tempQuat);

            Projectile._tempDir.multiplyScalar(this.speed * deltaTime);
            this.node.setWorldPosition(currentPos.x + Projectile._tempDir.x, currentPos.y + Projectile._tempDir.y, currentPos.z);
        }
    }
}
