import { _decorator, Component, Node, Prefab, NodePool, instantiate, Vec3, ParticleSystem2D } from 'cc';
import { GameManager } from './GameManager';
const { ccclass, property } = _decorator;

@ccclass('VFXManager')
export class VFXManager extends Component {

    @property({type: Prefab})
    public hitEffectPrefab: Prefab | null = null;
    @property({type: Prefab})
    public collectEffectPrefab: Prefab | null = null;

    private hitPool = new NodePool();
    private collectPool = new NodePool();

    onLoad() {
        this.initPool(this.hitPool, this.hitEffectPrefab, 5);
        this.initPool(this.collectPool, this.collectEffectPrefab, 10);
    }

    private initPool(pool: NodePool, prefab: Prefab | null, count: number) {
        if (!prefab) return;
        for (let i = 0; i < count; i++) {
            const node = instantiate(prefab);
            pool.put(node);
        }
    }

    public playHitEffect() {
        this.playEffect(this.hitPool, this.hitEffectPrefab);
    }

    public playCollectEffect() {
        this.playEffect(this.collectPool, this.collectEffectPrefab);
    }

    private playEffect(pool: NodePool, prefab: Prefab | null) {
        if (!prefab) return;
        const gameManager = GameManager.instance;
            if (!gameManager || !gameManager.playerController) {
                console.error("Player controller not found for FX!");
                return;
            }
            const playerNode = gameManager.playerController.node;
        let effectNode: Node | null = pool.size() > 0 ? pool.get() : instantiate(prefab);

        if (effectNode) {
            const particleSystem = effectNode.getComponent(ParticleSystem2D);
            if (particleSystem) {
                particleSystem.resetSystem();
                
                // --- THIS IS THE FIX ---
                // 1. Add the effect as a child of the player node.
                playerNode.addChild(effectNode);
                
                // 2. Set its position to (0,0,0) so it's centered on the player.
                effectNode.setPosition(Vec3.ZERO);

                this.scheduleOnce(() => {
                    // When the effect is done, return it to the pool.
                    // The pool automatically removes it from its parent (the player).
                    pool.put(effectNode);
                }, particleSystem.life + particleSystem.duration);
            } else {
                effectNode.destroy();
            }
        }
    }
}
