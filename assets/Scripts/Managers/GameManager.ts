import { _decorator, Component, Node, Prefab, Vec3, Label, tween, UITransform } from 'cc';
import { PoolManager } from './PoolManager';
import { BuildSpot } from './BuildSpot';
import { Enemy } from '../GamePlay/Enemy';
import { Coin } from '../GamePlay/Coin';
import { GameState } from '../Core/GameState';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager;

    @property([Node]) public waypoints: Node[] = [];
    @property(Node) public buildSpotsContainer: Node = null!;
    @property(Node) public enemiesContainer: Node = null!;
    @property(Node) public towersContainer: Node = null!;
    @property(Node) public effectsLayer: Node = null!;

    @property(Prefab) public enemyPrefab: Prefab = null!;
    @property(Prefab) public coinPrefab: Prefab = null!;

    @property(Node) public walletIconNode: Node = null!;
    @property(Label) public currencyLabel: Label = null!;
    @property(Node) public endCardUI: Node = null!;

    @property public spawnInterval: number = 1.5;

    public currency: number = 150;

    private buildSpots: BuildSpot[] = [];
    private spawnTimer: number = 0;
    private static _tempDistVec = new Vec3();

    private totalPlayTime: number = 0;
    private isBossSpawned: boolean = false;
    public isGameOver: boolean = false;

    onLoad() {
        GameManager.instance = this;
        this.buildSpots = this.buildSpotsContainer.getComponentsInChildren(BuildSpot);
        this.updateCurrencyUI();
        if (this.endCardUI) this.endCardUI.active = false;
    }

    update(deltaTime: number) {
        if (this.isGameOver || !GameState.isStarted || GameState.isPaused) return;

        this.totalPlayTime += deltaTime;

        if (this.totalPlayTime >= 30.0 && !this.isBossSpawned) {
            this.spawnBoss();
        }

        if (!this.isBossSpawned) {
            this.spawnTimer += deltaTime;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnEnemy(100, 80, false);
                this.spawnTimer = 0;
            }
        }
    }

    private spawnEnemy(hp: number, speed: number, isBoss: boolean) {
        if (this.waypoints.length === 0) return;

        const enemyNode = PoolManager.instance.getObject(this.enemyPrefab);
        this.enemiesContainer.addChild(enemyNode);

        const enemy = enemyNode.getComponent(Enemy);
        if (enemy) enemy.init(this.waypoints, hp, speed, isBoss);
    }

    private spawnBoss() {
        this.isBossSpawned = true;
        this.spawnEnemy(5000, 50, true);
    }

    public triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        GameState.isPaused = true;

        if (this.endCardUI) {
            this.endCardUI.active = true;
            this.endCardUI.setScale(new Vec3(0, 0, 1));
            tween(this.endCardUI)
                .to(0.4, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'backOut' })
                .to(0.2, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    public enterBuildMode() {
        for (let i = 0; i < this.buildSpots.length; i++) {
            this.buildSpots[i].setHighlight(true);
        }
    }

    public exitBuildMode() {
        for (let i = 0; i < this.buildSpots.length; i++) {
            this.buildSpots[i].setHighlight(false);
        }
    }

    public addCurrency(amount: number) {
        this.currency += amount;
        this.updateCurrencyUI();
        this.bumpWalletUI();
    }

    public spendCurrency(amount: number) {
        this.currency -= amount;
        this.updateCurrencyUI();
    }

    public spawnCoin(worldPosition: Vec3) {
        if (!this.coinPrefab) return;

        const coinNode = PoolManager.instance.getObject(this.coinPrefab);
        this.effectsLayer.addChild(coinNode);

        const walletWorldPos = this.walletIconNode.worldPosition;
        const coin = coinNode.getComponent(Coin);

        if (coin) {
            const effectsTransform = this.effectsLayer.getComponent(UITransform);
            if (effectsTransform) {
                const startLocalPos = effectsTransform.convertToNodeSpaceAR(worldPosition);
                coin.drop(startLocalPos, walletWorldPos);
            }
        }
    }

    private updateCurrencyUI() {
        if (this.currencyLabel) this.currencyLabel.string = this.currency.toString();
    }

    private bumpWalletUI() {
        if (this.walletIconNode) {
            tween(this.walletIconNode)
                .to(0.1, { scale: new Vec3(1.2, 1.2, 1) })
                .to(0.1, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    public getClosestSpot(worldPos: Vec3, maxRadius: number): BuildSpot | null {
        let closestSpot: BuildSpot | null = null;
        let minDistance = maxRadius;

        for (let i = 0; i < this.buildSpots.length; i++) {
            const spot = this.buildSpots[i];
            Vec3.subtract(GameManager._tempDistVec, spot.node.worldPosition, worldPos);
            const dist = GameManager._tempDistVec.length();

            if (dist <= minDistance) {
                minDistance = dist;
                closestSpot = spot;
            }
        }
        return closestSpot;
    }
}
