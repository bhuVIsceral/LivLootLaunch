import { _decorator, Component, Node, input, Input, EventTouch, KeyCode, Vec2 } from 'cc';
import { PlayerController } from './PlayerController'; // We need to talk to the player
const { ccclass, property } = _decorator;

@ccclass('InputManager')
export class InputManager extends Component {

    // --- REFERENCES ---
    // We will drag the Player and UI buttons into these slots in the editor.
    @property({ type: PlayerController })
    public playerController: PlayerController | null = null;
    @property({ type: Node })
    public leftButton: Node | null = null;
    @property({ type: Node })
    public rightButton: Node | null = null;
    @property({ type: Node })
    public jumpButton: Node | null = null;

    // --- SWIPE DETECTION ---
    private touchStartPos: Vec2 = new Vec2();
    private touchStartTime: number = 0;
    private swipeThreshold: number = 40; // Minimum distance in pixels to register a swipe

    onLoad() {
        // --- REGISTER ALL LISTENERS ---
        // 1. Keyboard
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);

        // 2. Touch/Mouse Swipe
        //Global listeners
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        // this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        // this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        
        // 3. UI Buttons
        if (this.leftButton) this.leftButton.on(Node.EventType.TOUCH_START, this.playerController.moveLeft, this.playerController);
        if (this.rightButton) this.rightButton.on(Node.EventType.TOUCH_START, this.playerController.moveRight, this.playerController);
        if (this.jumpButton) this.jumpButton.on(Node.EventType.TOUCH_START, this.playerController.jump, this.playerController);
    }

    onDestroy() {
        // --- CLEAN UP LISTENERS ---
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        this.node.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        if (this.leftButton) this.leftButton.off(Node.EventType.TOUCH_START, this.playerController.moveLeft, this.playerController);
        if (this.rightButton) this.rightButton.off(Node.EventType.TOUCH_START, this.playerController.moveRight, this.playerController);
        if (this.jumpButton) this.jumpButton.off(Node.EventType.TOUCH_START, this.playerController.jump, this.playerController);
    }

    private onKeyDown(event: any) {
        if (!this.playerController) return;

        switch(event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this.playerController.moveLeft();
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this.playerController.moveRight();
                break;
            case KeyCode.KEY_W:
            case KeyCode.ARROW_UP:
            case KeyCode.SPACE:
                this.playerController.jump();
                break;
        }
    }

    private onTouchStart(event: EventTouch) {
        // Record the position where the touch began
        this.touchStartPos = event.getUILocation();
        this.touchStartTime = performance.now();
    }

    private onTouchEnd(event: EventTouch) {
        if (!this.playerController) return;

        const touchEndPos = event.getUILocation();
        const touchDuration = performance.now() - this.touchStartTime;
        const deltaX = touchEndPos.x - this.touchStartPos.x;
        const deltaY = touchEndPos.y - this.touchStartPos.y;

        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        const tapMovementThreshold = 25; // Max distance moved to still be considered a tap
        const tapDurationThreshold = 200; // Max time in milliseconds for a tap
        
        // Check if the swipe was primarily horizontal or vertical
        if (absDeltaX > absDeltaY && absDeltaX > this.swipeThreshold) {
            if (deltaX > 0) this.playerController.moveRight();
            else this.playerController.moveLeft();
            return; // It was a horizontal swipe, so we are done.
        } 

        // --- TAP DETECTION LOGIC ---
        // Check for a tap (short duration and minimal movement)
        if (touchDuration < tapDurationThreshold && absDeltaX < tapMovementThreshold && absDeltaY < tapMovementThreshold) {
            this.playerController.jump();
            return; // It was a tap, so we are done.
        }
    }
}
