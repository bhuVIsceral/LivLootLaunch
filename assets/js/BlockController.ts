import { _decorator, Component, Label, Sprite, SpriteFrame, Enum, CircleCollider2D, BoxCollider2D, RigidBody2D, PhysicsGroup, UIOpacity } from "cc";
import { GameManager } from './GameManager';
import { LocalizedLabel } from "./LocalizedLabel";
import { ETextKey } from "./LocalizationData";
import { AudioManager, ESFXType } from "./AudioManager";

const { ccclass, property } = _decorator;

// 1. Define all possible block types
export enum EBlockType {
    NORMAL_COFFEE,
    NORMAL_SHOPPING,
    NORMAL_FUEL,
    NORMAL_AIRPLANE,
    NORMAL_EXCHANGE,
    NORMAL_GAMING,
    BOOSTER_COIN_MAGNET,
    BOOSTER_DOUBLE_BOUNCE,
    BOOSTER_2X_MULTIPLIER,
    BOOSTER_EXTRA_COINS,
    STONE
}
// Make the enum available in the Inspector
Enum(EBlockType);

// 2. Create a "data packet" class for block configurations
// This is not a component, just a data structure we can use.
@ccclass('BlockConfig')
export class BlockConfig {
    @property({ type: EBlockType, tooltip: "The type of this block." })
    type: EBlockType = EBlockType.NORMAL_COFFEE;

    @property({ type: SpriteFrame, tooltip: "The icon to display on the block." })
    icon: SpriteFrame = null;

    @property({ type: ETextKey, tooltip: "Power up title"})
    titleTextKey : ETextKey = 0;

    @property({ type: ETextKey, tooltip: "Power up title"})
    descriptionTextKey : ETextKey = 0;

    @property({ tooltip: "The title to display on the block." })
    title: string = "";

    @property({ tooltip: "The description to display on the block." })
    description: string = "";

    @property({ tooltip: "The health/hit points for this block." })
    health: number = 20;

    @property({ tooltip: "Is this block a booster type?" })
    isCollidable: boolean = false;
}

// 3. The main BlockController component
@ccclass('BlockController')
export class BlockController extends Component {

    @property({type: AudioManager})
    audioManager : AudioManager = null;

    @property({ type: EBlockType, tooltip: "The type of this block." })
    blockType: EBlockType = EBlockType.NORMAL_COFFEE;

    @property({type: [Component]})
    public neighbours : BlockController[] = [];

    @property(Sprite)
    iconSprite: Sprite = null;

    @property({ type: LocalizedLabel, tooltip: "Localized Title Text"})
    titleLabelLocalized : LocalizedLabel = null;

    @property({ type: LocalizedLabel, tooltip: "Localized Description Text"})
    descriptionLabelLocalized : LocalizedLabel = null;

    @property(Label)
    titleLabel: Label = null;

    @property(Label)
    descriptionLabel: Label = null;

    @property(Label)
    healthLabel: Label = null;

    @property(BoxCollider2D)
    collider: BoxCollider2D = null;

    @property(RigidBody2D)
    rigidBody: RigidBody2D = null;

    @property()
    isCollidable: boolean = true;

    // Internal state
    private health: number = 0;    

    /**
     * This public method is called by the LevelController to initialize the block.
     */
    public setupBlock(config: BlockConfig) {
        // this.titleLabel.string = config.titleTextKey != ETextKey.EMPTY ? config.title : "";
        // this.descriptionLabel.string = config.description != "" ? config.description : "";
        console.log(config.type);
        this.blockType = config.type;
        this.health = config.health;
        this.isCollidable = config.isCollidable;
        // this.collider.sensor = !config.isBooster; // Boosters aren't sensors
        if(config.isCollidable === false)
        {
            this.collider.group = 4; // Example group for boosters
            this.collider.sensor = true;
        }
        else{
            this.titleLabelLocalized.enabled = true;
            this.descriptionLabelLocalized.enabled = true;
            this.titleLabelLocalized.SetText(config.titleTextKey);
            this.descriptionLabelLocalized.SetText(config.descriptionTextKey);
            this.titleLabel.getComponent(UIOpacity).opacity = 255;
            this.descriptionLabel.getComponent(UIOpacity).opacity = 255;
            // this.collider.group = 3; // Example group for normal blocks
            // this.collider.sensor = false;
        }
        // this.collider.group = config.isBooster === true ? 3 : 2; // Example groups
        this.collider.apply(); // Apply changes to the collider
        this.rigidBody.group = this.collider.group;
        
        if (this.iconSprite) {
            this.iconSprite.spriteFrame = config.icon;
        }
        
        this.updateHealthLabel();
    }

    public onHit() {
        if (!this.node.active) return;
        this.node.active = false; // Deactivate instead of destroying
        GameManager.instance?.blockDestroyed(this, this.health, this.node.getPosition());
        switch(this.blockType){
            case EBlockType.STONE:
                this.audioManager.playSFX(ESFXType.EXPLODE);
                break;
            case EBlockType.BOOSTER_2X_MULTIPLIER:
                this.audioManager.playSFX(ESFXType.POWERUP);
                break;
            case EBlockType.BOOSTER_COIN_MAGNET:
                this.audioManager.playSFX(ESFXType.POWERUP);
                break;
            case EBlockType.BOOSTER_DOUBLE_BOUNCE:
                this.audioManager.playSFX(ESFXType.POWERUP);
                break;
            case EBlockType.BOOSTER_EXTRA_COINS:
                this.audioManager.playSFX(ESFXType.POWERUP);
                break;
            default:
                this.audioManager.playSFX(ESFXType.GLASS);
                break;
        }
        this.scheduleOnce(this.activateBoosterEffect, 0);
    }

    /**
     * --- FILLED IN ---
     * Checks the block's type and activates any special power-up.
     */
    private activateBoosterEffect() {
        switch (this.blockType) {
            
            // Example 1: Destroy all neighbors
            case EBlockType.BOOSTER_COIN_MAGNET: 
            case EBlockType.BOOSTER_EXTRA_COINS: // e.g. "Livionaire 10x Coins"
                console.log("BOOSTER: Destroying neighbors!");
                for (const neighbor of this.neighbours) {
                    // Check if the neighbor exists and is still active
                    if (neighbor && neighbor.node.active) {
                        neighbor.getComponent(BlockController).onHit(); // This creates a chain reaction
                    }
                }
                break;
            
            // Example 2: Multiply score of all neighbors
            case EBlockType.BOOSTER_2X_MULTIPLIER:
                console.log("BOOSTER: Multiplying neighbor scores!");
                for (const neighbor of this.neighbours) {
                    if (neighbor && neighbor.node.active) {
                        neighbor.getComponent(BlockController).multiplyScore(2); // Call the new multiply function
                    }
                }
                break;

            case EBlockType.BOOSTER_DOUBLE_BOUNCE:
                // This power-up is handled by the BallController,
                // so the block does nothing special here.
                break;

            // case EBlockType.NORMAL:
            default:
                // Not a booster, do nothing.
                break;
        }
    }

    /**
     * --- FILLED IN ---
     * Multiplies this block's score value.
     */
    public multiplyScore(multiplier: number) {
        if (!this.node.active) return; // Can't multiply a destroyed block

        this.health *= multiplier;
        this.updateHealthLabel(); // Update the UI to show the new, higher score
    }
    
    private updateHealthLabel() {
        if (this.healthLabel) {
            this.healthLabel.string = this.health.toString();
        }
        if(this.health === 0) this.healthLabel.getComponent(UIOpacity).opacity = 0;
    }

    // Call this from LevelController to reset the level
    public resetBlock() {
        this.node.active = true;
    }

    public getBlockType(): EBlockType {
        return this.blockType;
    }
}