import {
    _decorator,
    Component,
    Node,
    Vec3,
    Sprite,
    SpriteFrame,
    Animation,
    tween,
} from "cc";

import { AudioManager } from "./AudioManager";
const { ccclass, property } = _decorator;

// We need to define our lane positions, just like in the old game.
// In Cocos, the center is 0, so the lanes are negative and positive.
const LANE_X_POSITIONS = [-160, 0, 160];

@ccclass("PlayerController")
export class PlayerController extends Component {
    // This is a special Cocos decorator. It makes the 'moveDuration' variable
    // visible and editable in the Inspector window in the editor!
    @property({ type: AudioManager }) public audioManager: AudioManager | null = null;
    @property
    public moveDuration = 0.25;
    @property
    public jumpHeight = 150;
    @property
    public jumpDuration = 0.5;

    // --- ANIMATION PROPERTIES ---
    // These properties will appear as slots in the Inspector.
    // We will drag our SVG images into these slots.
    @property({ type: SpriteFrame })
    public runFrame1: SpriteFrame | null = null;
    @property({ type: SpriteFrame })
    public runFrame2: SpriteFrame | null = null;
    @property({ type: SpriteFrame })
    public jumpFrame: SpriteFrame | null = null;
    @property
    public animationInterval = 0.15; // Time between run frame swaps

    // These variables will track the player's state.
    public isJumping = false;    
    private currentLane = 1; // Start in the middle lane (0=left, 1=middle, 2=right)
    private isMoving = false; // Prevents starting a new move while one is in progress
    private startY = 0; // The player's initial Y position
    private animationTimer = 0;
    private currentRunFrame = 0;
    private spriteComponent: Sprite | null = null;

    onLoad() {
        // 'onLoad' is a Cocos function that runs once, before 'start'.
        // It's the perfect place to set up input listeners.
        // Store the initial Y position to return to after a jump.
        this.startY = this.node.position.y;

        // Get the Sprite component so we can change the images.
        this.spriteComponent = this.getComponent(Sprite);
        
    }

    // start() {
    //     // In start, we set up listeners that interact with other engine systems.
    //     // This is safer because all nodes are guaranteed to be ready.
    //     input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    // }

    // onDestroy() {
    //     // This is important for preventing memory leaks!
    //     // We remove the listener when the player object is destroyed.
    //     input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    // }

    // private onKeyDown(event: any) {
    //     // This function is called every time a key is pressed.
    //     // Don't allow any new actions while already jumping or sliding.
    //     if (this.isJumping || this.isMoving) {
    //         return;
    //     }
    //     switch (event.keyCode) {
    //         case KeyCode.KEY_A:
    //         case KeyCode.ARROW_LEFT:
    //             this.moveLeft();
    //             break;
    //         case KeyCode.KEY_D:
    //         case KeyCode.ARROW_RIGHT:
    //             this.moveRight();
    //             break;
    //         case KeyCode.KEY_W:
    //         case KeyCode.ARROW_UP:
    //         case KeyCode.SPACE:
    //             this.jump();
    //             break;
    //     }
    // }

    update(deltaTime: number) {
        // This function runs every frame. We'll use it to update the animation.
        this.handleAnimation(deltaTime);
    }

    private handleAnimation(deltaTime: number) {
        if (!this.spriteComponent) return;

        if (this.isJumping) {
            // If jumping, always show the jump frame.
            this.spriteComponent.spriteFrame = this.jumpFrame;
        } else {
            // If not jumping, handle the running animation.
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.animationInterval) {
                this.animationTimer = 0;
                // Swap between frame 0 and 1
                this.currentRunFrame = 1 - this.currentRunFrame;
                this.spriteComponent.spriteFrame =
                    this.currentRunFrame === 0
                        ? this.runFrame1
                        : this.runFrame2;
            }
        }
    }

    public moveLeft() {
        // We only move if the player is not already moving and not in the leftmost lane.
        if (this.isJumping || this.isMoving || this.currentLane === 0) {
            return;
        }
        this.currentLane--;
        this.startMoveTween();
    }

    public moveRight() {
        // We only move if the player is not already moving and not in the rightmost lane.
        if (this.isJumping || this.isMoving || this.currentLane === 2) {
            return;
        }
        this.currentLane++;
        this.startMoveTween();
    }

    public jump() {
        if (this.isJumping) return;
        this.isJumping = true;
        this.audioManager?.playJumpSfx();
        // Use a tween to animate the jump.
        tween(this.node)
            // Go up
            .to(
                this.jumpDuration / 2,
                {
                    position: new Vec3(
                        this.node.position.x,
                        this.startY + this.jumpHeight,
                        this.node.position.z
                    ),
                },
                { easing: "cubicOut" }
            )
            // Then go down
            .to(
                this.jumpDuration / 2,
                {
                    position: new Vec3(
                        this.node.position.x,
                        this.startY,
                        this.node.position.z
                    ),
                },
                { easing: "cubicIn" }
            )
            // When finished, set isJumping back to false.
            .call(() => {
                this.isJumping = false;
            })
            .start();
    }

    private startMoveTween() {
        this.isMoving = true;

        // Get the target X position from our array
        const targetX = LANE_X_POSITIONS[this.currentLane];

        // This is the magic of the tween system!
        tween(this.node)
            .to(this.moveDuration, {
                position: new Vec3(
                    targetX,
                    this.node.position.y,
                    this.node.position.z
                ),
            })
            .call(() => {
                this.isMoving = false;
            })
            .start();
    }
}
