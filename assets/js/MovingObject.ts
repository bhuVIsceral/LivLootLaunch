import { _decorator, Component, Node, Vec3, tween, UIOpacity, UITransform } from "cc";
import { Spawner } from "./Spawner";
import { GameManager } from "./GameManager";
import { Tagger, EObjectType } from "./Tagger";

const { ccclass, property } = _decorator;

// This is the Y position where objects are considered "off-screen" at the bottom.
const OFF_SCREEN_Y = -550;
const MAGNET_RADIUS = 450;

@ccclass("MovingObject")
export class MovingObject extends Component {
    public spawner: Spawner | null = null;
    public laneIndex: number = 0;

    // --- NEW: Flag to prevent double despawn during animation ---
    public isAnimatingDespawn: boolean = false;
    private initialScale: Vec3 = new Vec3(); // Store original scale

    onLoad() {
        // Listen for the 'despawn' event
        this.node.on("despawn", this.initiateDespawn, this);
        this.initialScale.set(this.node.scale); // Store initial scale on load
    }

    onDestroy() {
        this.node.off("despawn", this.initiateDespawn, this);
    }

    // Called when the object is taken from the pool
    reuse() {
        this.isAnimatingDespawn = false; // Reset the flag
        this.node.setScale(this.initialScale); // Reset scale
        const opacity = this.getComponent(UIOpacity);
        if (opacity) {
            opacity.opacity = 255; // Reset opacity
        }
    }
     // Called before the object is put back into the pool
    unuse() {
        // Optional cleanup if needed
    }

    update(deltaTime: number) {
        // --- Prevent movement if despawn animation is playing ---
        if (this.isAnimatingDespawn) {
            return;
        }
        // --- MAGNET LOGIC ---
        // We use the singleton to easily access the game state.
        const gameManager = GameManager.instance;
        if (!gameManager) return; // Safety check

        const currentSpeed = gameManager.currentGameSpeed;
        const tagger = this.getComponent(Tagger);

        let wasAttracted = false; // A flag to check if magnet logic was applied

        if (gameManager && gameManager.playerController && tagger && 
            tagger.tag !== EObjectType.Obstacle &&
            tagger.tag !== EObjectType.None &&
            gameManager.powerupManager?.isActive(EObjectType.PowerupMagnet)) {
            // If this is a chilli and the magnet is active, move towards the player.
            const playerNode = gameManager.playerController.node;
            const targetPos = playerNode.position;
            const currentPos = this.node.position;
            
            // Calculate the distance between the chilli and the player
            const distance = Vec3.distance(currentPos, targetPos);

            if(distance < MAGNET_RADIUS) {
                // Interpolate (lerp) towards the player's position
                const newPos = new Vec3();
                Vec3.lerp(newPos, currentPos, targetPos, 0.1);
                this.node.setPosition(newPos);
                wasAttracted = true;
            }

        }   
        if (!wasAttracted) {
            // Move the object down the screen on every frame
            if (!this.spawner || !this.spawner.laneRenderer) {
                return;
            }
            
            const newPos = this.node.getPosition();
            // newPos.y += this.speed * deltaTime;
            newPos.y -= currentSpeed * deltaTime;
            newPos.x = this.spawner.laneRenderer.laneCenterXAtY(this.laneIndex, newPos.y);
            this.node.setPosition(newPos);
        }

        // Check if the object has gone off the bottom of the screen
        if (this.node.position.y < OFF_SCREEN_Y) {
            // If it has, tell the spawner to recycle it.
            this.initiateDespawn();
        }
    }

    // --- Renamed to initiateDespawn to distinguish from the actual pooling ---
    private initiateDespawn() {
        // Prevent starting the animation multiple times
        if (this.isAnimatingDespawn || !this.node.parent) {
            return;
        }

        const tagger = this.getComponent(Tagger);
        const isPowerup = tagger && (
            tagger.tag === EObjectType.PowerupSpeed ||
            tagger.tag === EObjectType.PowerupMagnet ||
            tagger.tag === EObjectType.Powerup2x ||
            tagger.tag === EObjectType.PowerupShield
        );

        if (isPowerup) {
            // --- POWER-UP: Start the animation ---
            this.isAnimatingDespawn = true;
            const opacity = this.getComponent(UIOpacity);
            const uiTransform = this.getComponent(UITransform); // Needed for z-index

            if (opacity && uiTransform) {
                 // Bring to front temporarily
                uiTransform.priority = 1000;

                tween(this.node)
                    .to(.05, { worldPosition: new Vec3(270, 480, 0) }, { easing: 'cubicIn' }) // Scale up fast
                    .start();
                tween(this.node)
                    .to(.3, { scale: new Vec3(2, 2, 1) }, { easing: 'cubicIn' }) // Scale up fast
                    .start();
                tween(opacity)
                    .to(.5, { opacity: 0 }, { easing: 'cubicIn' }) // Fade out slightly slower
                    .call(() => {
                        this.finishDespawn(); // Call the actual despawn when done
                    })
                    .start();
            } else {
                // Fallback if components are missing
                console.warn("Powerup missing UIOpacity or UITransform for animation.");
                this.finishDespawn();
            }
        } else {
            // --- NOT a power-up: Despawn immediately ---
            this.finishDespawn();
        }
    }

    // --- This function handles the actual return to the pool ---
    private finishDespawn() {
        if (!this.node.parent) { // Extra safety check
            return;
        }
        if (this.spawner) {
            // Reset priority before returning to pool
            const uiTransform = this.getComponent(UITransform);
            if(uiTransform) uiTransform.priority = 0;

            this.spawner.despawnObject(this.node);
            // Don't reset flag here, reuse() will handle it.
        }
    }
}
