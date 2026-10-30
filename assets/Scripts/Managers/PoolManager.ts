import { _decorator, Component, Node, instantiate, Prefab } from 'cc';
const { ccclass } = _decorator;

@ccclass('PoolManager')
export class PoolManager extends Component {
    public static instance: PoolManager;

    private pools: Map<string, Node[]> = new Map();

    onLoad() {
        if (!PoolManager.instance) {
            PoolManager.instance = this;
        }
    }

    public getObject(prefab: Prefab): Node {
        const name = prefab.data.name;
        if (!this.pools.has(name)) {
            this.pools.set(name, []);
        }

        const pool = this.pools.get(name)!;
        if (pool.length > 0) {
            const node = pool.pop()!;
            node.active = true;
            return node;
        }

        const newNode = instantiate(prefab);
        newNode.active = true;
        return newNode;
    }

    public returnObject(node: Node) {
        node.active = false;

        import('cc').then((cc) => cc.Tween.stopAllByTarget(node));

        const pool = this.pools.get(node.name);
        if (pool) {
            pool.push(node);
        } else {
            this.pools.set(node.name, [node]);
        }
    }
}
