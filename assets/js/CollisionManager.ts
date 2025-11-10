import {
    _decorator,
    Component,
    Collider2D,
    IPhysics2DContact,
    BoxCollider2D,
} from "cc";
import { GameManager } from "./GameManager";
import { Tagger, EObjectType } from './Tagger';
import { PlayerController } from "./PlayerController";
const { ccclass, property } = _decorator;

@ccclass("CollisionManager")
export class CollisionManager extends Component {
    @property({ type: GameManager })
    public gameManager: GameManager | null = null;

    private playerController: PlayerController | null = null;

    start() {
        this.playerController =this.getComponent(PlayerController);

        // Register the collision listener in 'start' for safety.
        const collider = this.getComponent(BoxCollider2D);
        if (collider) {
            collider.on('begin-contact', this.onBeginContact, this);
            console.log("Collision listener registered on Player.");
        } else {
            console.error("Player is missing its BoxCollider2D component!");
        }
    }

    onDestroy() {
        // Clean up the listener when the component is destroyed.
        const collider = this.getComponent(BoxCollider2D);
        if (collider) {
            collider.off('begin-contact', this.onBeginContact, this);
        }
    }

    private onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        if (!this.gameManager) return;
        
        // --- NEW LOGIC ---
        // Instead of checking the integer tag, we get our custom Tagger component.
        const tagger = otherCollider.getComponent(Tagger);
        if (!tagger) {
            // If the object has no tagger, we ignore it.
            return;
        }

        const objectTag = tagger.tag;
        const otherNode = otherCollider.node;
        const effectPosition = otherNode.getWorldPosition();

        // Now we compare against our safe enum values.
        if (objectTag === EObjectType.Chilli) {
            this.gameManager.onPlayerCollectChilli();
            otherCollider.node.emit('despawn');
        } else if (objectTag === EObjectType.Obstacle) {
            // Before registering a hit, we check if the player is jumping.
            if (this.playerController && this.playerController.isJumping) {
                // If the player is in the air, do nothing and ignore the obstacle collision.
                return; 
            }
            // If the player is NOT jumping, then it's a valid hit.
            this.gameManager.onPlayerHitObstacle();
        } else if (objectTag === EObjectType.PowerupSpeed || objectTag === EObjectType.PowerupMagnet || objectTag === EObjectType.Powerup2x || objectTag === EObjectType.PowerupShield) {
            this.gameManager.onPlayerCollectPowerUp(objectTag);
            otherCollider.node.emit('despawn');
        }
    }
}
