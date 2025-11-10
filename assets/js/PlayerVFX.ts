import { _decorator, Component, Sprite, SpriteFrame, UIOpacity, Node, Color, v3 } from 'cc'; // Removed 'tween' import
import { EObjectType } from './Tagger';
const { ccclass, property } = _decorator;

// Define constants for the animation phases
enum VFXState {
    Idle,
    FadingIn,
    Holding,
    FadingOut
}

@ccclass('PlayerVFX')
export class PlayerVFX extends Component {

    @property(Sprite)
    public vfxSprite: Sprite | null = null;

    @property(UIOpacity)
    public vfxOpacity: UIOpacity | null = null;

    @property({ type: SpriteFrame }) public defaultVFXSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public speedVFXSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public magnetVFXSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public twoXVFXSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public shieldVFXSprite: SpriteFrame | null = null;

    // --- NEW: State variables for manual animation ---
    private currentState: VFXState = VFXState.Idle;
    private timer: number = 0;
    private readonly fadeInDuration: number = 0.1;
    private readonly holdDuration: number = 0.35;
    private readonly fadeOutDuration: number = 0.25;

    protected onLoad(): void {
        if (this.vfxSprite && this.vfxOpacity) {
            this.vfxOpacity.opacity = 0; // Start hidden
        }
    }

    // --- NEW: Update loop to handle the animation manually ---
    update(deltaTime: number) {
        if (!this.vfxOpacity) return;

        switch (this.currentState) {
            case VFXState.FadingIn:
                this.timer += deltaTime;
                this.vfxOpacity.opacity = Math.min(255, (this.timer / this.fadeInDuration) * 255);
                if (this.timer >= this.fadeInDuration) {
                    this.vfxOpacity.opacity = 255;
                    this.currentState = VFXState.Holding;
                    this.timer = 0; // Reset timer for hold phase
                }
                break;

            case VFXState.Holding:
                this.timer += deltaTime;
                if (this.timer >= this.holdDuration) {
                    this.currentState = VFXState.FadingOut;
                    this.timer = 0; // Reset timer for fade out phase
                }
                break;

            case VFXState.FadingOut:
                this.timer += deltaTime;
                this.vfxOpacity.opacity = Math.max(0, 255 - (this.timer / this.fadeOutDuration) * 255);
                if (this.timer >= this.fadeOutDuration) {
                    this.vfxOpacity.opacity = 0;
                    this.currentState = VFXState.Idle;
                    if (this.vfxSprite) {
                        this.vfxSprite.spriteFrame = null; // Clear sprite when done
                    }
                }
                break;

            case VFXState.Idle:
            default:
                // Do nothing while idle
                break;
        }
    }

    public playVFX(activePowerupType: EObjectType = EObjectType.None) {
        if (!this.vfxSprite || !this.vfxOpacity || this.currentState !== VFXState.Idle) {
             // Don't restart if already playing, unless you want that behavior
             // If you want restart capability, you'd reset state/timer here
             return;
        }


        let spriteFrameToUse: SpriteFrame | null = null;
        // let vfxColor: Color = Color.WHITE;

        switch (activePowerupType) {
            case EObjectType.PowerupSpeed:
                spriteFrameToUse = this.speedVFXSprite;
                // vfxColor = Color.GREEN;
                break;
            case EObjectType.PowerupMagnet:
                spriteFrameToUse = this.magnetVFXSprite;
                // vfxColor = Color.YELLOW;
                break;
            case EObjectType.Powerup2x:
                spriteFrameToUse = this.twoXVFXSprite;
                // vfxColor = Color.BLUE;
                break;
            case EObjectType.PowerupShield:
                spriteFrameToUse = this.shieldVFXSprite;
                // vfxColor = Color.CYAN;
                break;
            default:
                spriteFrameToUse = this.defaultVFXSprite;
                break;
        }

        if (!spriteFrameToUse) {
            console.warn("PlayerVFX: No sprite frame assigned for active powerup type or default.");
            spriteFrameToUse = this.defaultVFXSprite;
            if (!spriteFrameToUse) return;
        }

        // --- Start the animation ---
        this.vfxSprite.spriteFrame = spriteFrameToUse;
        // this.vfxSprite.color = vfxColor;
        this.vfxOpacity.opacity = 0; // Ensure it starts transparent
        this.currentState = VFXState.FadingIn;
        this.timer = 0; // Reset the timer

        if (this.node.parent) {
             this.node.setSiblingIndex(this.node.parent.children.length - 1);
        }
    }
}

