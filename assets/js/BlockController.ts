import { _decorator, Component, Label, Sprite, SpriteFrame, Enum, CircleCollider2D, BoxCollider2D, RigidBody2D, PhysicsGroup } from "cc";
import { GameManager } from './GameManager';
import { LocalizedLabel } from "./LocalizedLabel";
import { ETextKey } from "./LocalizationData";

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
    BOOSTER_EXTRA_COINS
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
    isBooster: boolean = false;
}

// 3. The main BlockController component
@ccclass('BlockController')
export class BlockController extends Component {

    @property({ type: EBlockType, tooltip: "The type of this block." })
    blockType: EBlockType = EBlockType.NORMAL_COFFEE;

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
    isBooster: boolean = true;

    // Internal state
    private health: number = 0;    

    /**
     * This public method is called by the LevelController to initialize the block.
     */
    public setupBlock(config: BlockConfig) {
        this.blockType = config.type;
        this.titleLabel.string = config.title != "" ? config.title : "";
        this.descriptionLabel.string = config.description != "" ? config.description : "";
        this.health = config.health;
        this.isBooster = config.isBooster;
        // this.collider.sensor = !config.isBooster; // Boosters aren't sensors
        if(config.isBooster === false)
        {
            this.collider.group = 4; // Example group for boosters
            this.collider.sensor = true;
        }
        // else{
        //     this.titleLabelLocalized.enabled = true;
        //     this.descriptionLabelLocalized.enabled = true;
        //     this.titleLabelLocalized.SetText(config.titleTextKey);
        //     this.descriptionLabelLocalized.SetText(config.descriptionTextKey);
            // this.collider.group = 3; // Example group for normal blocks
            // this.collider.sensor = false;
        // }
        // this.collider.group = config.isBooster === true ? 3 : 2; // Example groups
        this.collider.apply(); // Apply changes to the collider
        this.rigidBody.group = this.collider.group;
        
        if (this.iconSprite) {
            this.iconSprite.spriteFrame = config.icon;
        }
        
        this.updateHealthLabel();
    }

    public onHit() {
        GameManager.instance?.blockDestroyed(this, this.health, this.node.getPosition());
        this.node.active = false; // Deactivate instead of destroying
    }

    private updateHealthLabel() {
        if (this.healthLabel) {
            this.healthLabel.string = this.health.toString();
        }
    }

    // Call this from LevelController to reset the level
    public resetBlock() {
        this.node.active = true;
    }

    public getBlockType(): EBlockType {
        return this.blockType;
    }
}