import { _decorator, Component, Node, Vec3, Label, Sprite, SpriteFrame, tween, Color } from 'cc';
import { PoolManager } from '../Managers/PoolManager';
import { GameState } from '../Core/GameState';
const { ccclass, property } = _decorator;

@ccclass('Enemy')
export class Enemy extends Component {
    @property(Label) public hpLabel: Label = null!;
    @property(Sprite) public sprite: Sprite = null!;
    @property(SpriteFrame) public defaultFrame: SpriteFrame = null!;
    @property(SpriteFrame) public tombstoneFrame: SpriteFrame = null!;

    private maxHp: number = 80;
    private currentHp: number = 80;
    private speed: number = 100;
    private isDead: boolean = false;
    private isBossEnemy: boolean = false;
    private waypoints: Node[] = [];
    private currentWaypointIndex: number = 0;
    private freezeTimer: number = 0;
    private burnTimer: number = 0;
    private burnTickTimer: number = 0;

    private static _tempDir = new Vec3();
    private static readonly COLOR_NORMAL = new Color(255, 255, 255, 255);
    private static readonly COLOR_FROZEN = new Color(100, 200, 255, 255);
    private static readonly COLOR_BURN = new Color(255, 100, 100, 255);
    private static readonly COLOR_BOSS = new Color(255, 50, 50, 255);
    private static readonly SCALE_NORMAL = new Vec3(1, 1, 1);

    public init(waypoints: Node[], hp: number, speed: number, isBoss: boolean = false) {
        this.waypoints = waypoints;
        this.currentWaypointIndex = 0;
        this.maxHp = hp;
        this.currentHp = hp;
        this.speed = speed;
        this.isDead = false;
        this.freezeTimer = 0;
        this.burnTimer = 0;
        this.isBossEnemy = isBoss;

        this.node.setScale(Enemy.SCALE_NORMAL);

        if (isBoss) {
            if (this.sprite) this.sprite.color = Enemy.COLOR_BOSS;
        } else {
            if (this.sprite) {
                this.sprite.spriteFrame = this.defaultFrame;
                this.sprite.color = Enemy.COLOR_NORMAL;
            }
        }

        this.updateHpUI();
        if (this.waypoints.length > 0 && this.waypoints[0]) {
            this.node.setWorldPosition(this.waypoints[0].worldPosition);
        }
    }

    public takeDamage(amount: number) {
        if (this.isDead) return;
        this.currentHp -= amount;
        this.updateHpUI();

        if (this.sprite) {
            this.sprite.color = new Color(255, 255, 255, 255);
            setTimeout(() => {
                if (!this.isValid || this.isDead) return;
                if (this.freezeTimer > 0) this.sprite.color = Enemy.COLOR_FROZEN;
                else if (this.burnTimer > 0) this.sprite.color = Enemy.COLOR_BURN;
                else this.sprite.color = this.isBossEnemy ? Enemy.COLOR_BOSS : Enemy.COLOR_NORMAL;
            }, 100);
        }

        if (this.currentHp <= 0) {
            this.die();
        }
    }

    public applyFreeze(duration: number) {
        this.freezeTimer = duration;
        if (this.sprite) this.sprite.color = Enemy.COLOR_FROZEN;
    }

    public applyBurn(duration: number) {
        this.burnTimer = Math.max(this.burnTimer, duration);
        if (this.sprite) this.sprite.color = Enemy.COLOR_BURN;
    }

    private updateHpUI() {
        if (this.hpLabel) {
            this.hpLabel.string = Math.max(0, Math.floor(this.currentHp)).toString();
        }
    }

    private die() {
        this.isDead = true;
        this.speed = 0;
        if (this.hpLabel) this.hpLabel.node.active = false;
        if (this.sprite && this.tombstoneFrame) {
            this.sprite.spriteFrame = this.tombstoneFrame;
        }

        tween(this.node)
            .to(0.15, { scale: new Vec3(1.2, 1.2, 1.2) }, { easing: 'quadOut' })
            .to(0.15, { scale: new Vec3(0, 0, 0) }, { easing: 'quadIn' })
            .call(() => {
                import('../Managers/GameManager').then((module) => {
                    module.GameManager.instance.spawnCoin(this.node.worldPosition);
                });
                if (this.hpLabel) this.hpLabel.node.active = true;
                PoolManager.instance.returnObject(this.node);
            })
            .start();
    }

    update(deltaTime: number) {
        if (GameState.isPaused || this.isDead || this.currentWaypointIndex >= this.waypoints.length) return;

        let currentSpeed = this.speed;

        if (this.freezeTimer > 0) {
            this.freezeTimer -= deltaTime;
            currentSpeed = this.speed * 0.5;
            if (this.freezeTimer <= 0 && this.burnTimer <= 0) {
                this.sprite.color = this.isBossEnemy ? Enemy.COLOR_BOSS : Enemy.COLOR_NORMAL;
            }
        }

        if (this.burnTimer > 0) {
            this.burnTimer -= deltaTime;
            this.burnTickTimer += deltaTime;
            if (this.burnTickTimer >= 0.5) {
                this.takeDamage(10);
                this.burnTickTimer = 0;
            }
            if (this.burnTimer <= 0 && this.freezeTimer <= 0) {
                this.sprite.color = this.isBossEnemy ? Enemy.COLOR_BOSS : Enemy.COLOR_NORMAL;
            }
        }

        const targetPos = this.waypoints[this.currentWaypointIndex].worldPosition;
        const currentPos = this.node.worldPosition;

        Vec3.subtract(Enemy._tempDir, targetPos, currentPos);
        const distance = Enemy._tempDir.length();

        if (distance < 5) {
            this.currentWaypointIndex++;
            if (this.currentWaypointIndex >= this.waypoints.length) {
                import('../Managers/GameManager').then((m) => m.GameManager.instance.triggerGameOver());
                PoolManager.instance.returnObject(this.node);
            }
        } else {
            Enemy._tempDir.normalize();
            Enemy._tempDir.multiplyScalar(currentSpeed * deltaTime);
            this.node.setWorldPosition(currentPos.x + Enemy._tempDir.x, currentPos.y + Enemy._tempDir.y, currentPos.z);
        }
    }
}
