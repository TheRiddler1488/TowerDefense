import { _decorator, Component, Node, Prefab, Vec3, tween, SpriteFrame, Sprite } from 'cc';
import { Enemy } from './Enemy';
import { PoolManager } from '../Managers/PoolManager';
import { Projectile } from './Projectile';
import { GameState } from '../Core/GameState';
import { EventBus, EventType, SFXType } from '../Core/EventBus';
const { ccclass, property } = _decorator;

export enum DamageType {
    NORMAL = 0,
    ICE = 1,
    FIRE = 2
}

@ccclass('Tower')
export class Tower extends Component {
    @property(Prefab) public projectilePrefab: Prefab = null!;
    @property(Node) public visualNode: Node = null!;

    @property(Sprite) public towerSprite: Sprite = null!;
    @property([SpriteFrame]) public levelSprites: SpriteFrame[] = [];

    @property
    public attackRange: number = 350;
    public level: number = 1;
    public damageType: DamageType = DamageType.NORMAL;

    private attackCooldown: number = 1.0;
    private damage: number = 35;
    private timer: number = 0;
    private enemiesContainer: Node | null = null;
    private static _tempDistVec = new Vec3();

    public init(enemiesContainer: Node) {
        this.enemiesContainer = enemiesContainer;
        this.level = 1;
        this.updateStats();

        if (this.towerSprite && this.levelSprites[0]) {
            this.towerSprite.spriteFrame = this.levelSprites[0];
        }
    }

    public mergeLevelUp() {
        this.level++;
        this.updateStats();

        if (this.towerSprite && this.levelSprites[this.level - 1]) {
            this.towerSprite.spriteFrame = this.levelSprites[this.level - 1];
        }

        if (this.visualNode) {
            tween(this.visualNode)
                .to(0.2, { scale: new Vec3(1.3, 1.3, 1) })
                .to(0.2, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    private updateStats() {
        if (this.level === 1) {
            this.damage = 35;
            this.attackCooldown = 1.0;
            this.damageType = DamageType.NORMAL;
        } else if (this.level === 2) {
            this.damage = 55;
            this.attackCooldown = 0.8;
            this.damageType = DamageType.ICE;
        } else if (this.level >= 3) {
            this.damage = 90;
            this.attackCooldown = 0.6;
            this.damageType = DamageType.FIRE;
        }
    }

    update(deltaTime: number) {
        if (!GameState.isStarted || GameState.isPaused) return;
        if (!this.enemiesContainer) {
            import('../Managers/GameManager').then((m) => {
                if (m.GameManager.instance) this.init(m.GameManager.instance.enemiesContainer);
            });
            return;
        }

        this.timer += deltaTime;
        if (this.timer >= this.attackCooldown) {
            const target = this.findClosestEnemy();
            if (target) {
                this.shoot(target);
                this.timer = 0;
            }
        }
    }

    private findClosestEnemy(): Enemy | null {
        if (!this.enemiesContainer) return null;
        let closestEnemy: Enemy | null = null;
        let minDistance = this.attackRange;
        const currentPos = this.node.worldPosition;
        const enemies = this.enemiesContainer.children;

        for (let i = 0; i < enemies.length; i++) {
            const enemyNode = enemies[i];
            if (!enemyNode.active) continue;

            Vec3.subtract(Tower._tempDistVec, enemyNode.worldPosition, currentPos);
            const distance = Tower._tempDistVec.length();

            if (distance <= minDistance) {
                minDistance = distance;
                closestEnemy = enemyNode.getComponent(Enemy);
            }
        }
        return closestEnemy;
    }

    private shoot(target: Enemy) {
        if (this.visualNode) {
            tween(this.visualNode)
                .to(0.1, {
                    position: new Vec3(0, 10, 0),
                    scale: new Vec3(1.1, 0.9, 1)
                })
                .to(0.1, {
                    position: new Vec3(0, 0, 0),
                    scale: new Vec3(1, 1, 1)
                })
                .start();
        }

        const projNode = PoolManager.instance.getObject(this.projectilePrefab);
        this.node.parent!.addChild(projNode);
        projNode.setWorldPosition(this.node.worldPosition);

        const projectile = projNode.getComponent(Projectile);
        if (projectile) projectile.init(target, this.damage, this.damageType);

        const sfx = this.damageType === DamageType.NORMAL ? SFXType.SHOOT_NORMAL : this.damageType === DamageType.ICE ? SFXType.SHOOT_ICE : SFXType.SHOOT_FIRE;
        EventBus.emit(EventType.PLAY_SFX, sfx);
    }
}
