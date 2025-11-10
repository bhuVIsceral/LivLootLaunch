import { _decorator, Component, Node, Sprite, SpriteFrame, Color } from 'cc';
import { EObjectType } from './Tagger';
const { ccclass, property } = _decorator;

@ccclass('EnvironmentManager')
export class EnvironmentManager extends Component {

    // --- SPRITE REFERENCES ---
    // Drag your ground and lane Sprite nodes/components here in the editor
    @property({ type: Sprite })
    public skySprite: Sprite | null = null;
    @property({ type: Sprite })
    public groundSprite: Sprite | null = null;
    @property({ type: Sprite })
    public leftLaneSprite: Sprite | null = null;
    @property({ type: Sprite })
    public rightLaneSprite: Sprite | null = null;

    // --- SPRITEFRAME ASSETS ---
    // Drag the corresponding SpriteFrame assets here in the editor

    @property({ type: SpriteFrame }) public defaultSkySprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public speedSkySprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public magnetSkySprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public twoXSkySprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public shieldSkySprite: SpriteFrame | null = null;

    @property({ type: SpriteFrame }) public defaultGroundSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public speedGroundSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public magnetGroundSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public twoXGroundSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public shieldGroundSprite: SpriteFrame | null = null;

    @property({ type: SpriteFrame }) public defaultLaneSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public speedLaneSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public magnetLaneSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public twoXLaneSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public shieldLaneSprite: SpriteFrame | null = null;

    @property({ type: SpriteFrame }) public defaultRightLaneSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public speedRightLaneSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public magnetRightLaneSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public twoXRightLaneSprite: SpriteFrame | null = null;
    @property({ type: SpriteFrame }) public shieldRightLaneSprite: SpriteFrame | null = null;

    // This public function will be called by the GameManager
    public updateVisuals(activePowerupType: EObjectType = EObjectType.None) {
        let skySF: SpriteFrame | null = this.defaultSkySprite;
        let groundSF: SpriteFrame | null = this.defaultGroundSprite;
        let laneSF: SpriteFrame | null = this.defaultLaneSprite;
        let laneRightSF: SpriteFrame | null = this.defaultLaneSprite;
        // let tintColor: Color = Color.WHITE; // Optional: Tint the sprites

        switch (activePowerupType) {
            case EObjectType.PowerupSpeed:
                skySF = this.speedSkySprite ?? this.defaultSkySprite;
                groundSF = this.speedGroundSprite ?? this.defaultGroundSprite;
                laneSF = this.speedLaneSprite ?? this.defaultLaneSprite;
                laneRightSF = this.speedRightLaneSprite ?? this.defaultRightLaneSprite;
                // tintColor = Color.fromHEX('#60D394');
                break;
            case EObjectType.PowerupMagnet:
                skySF = this.magnetSkySprite ?? this.defaultSkySprite;
                groundSF = this.magnetGroundSprite ?? this.defaultGroundSprite;
                laneSF = this.magnetLaneSprite ?? this.defaultLaneSprite;
                laneRightSF = this.magnetRightLaneSprite ?? this.defaultRightLaneSprite;
                // tintColor = Color.fromHEX('#FFD166');
                break;
            case EObjectType.Powerup2x:
                skySF = this.twoXSkySprite?? this.defaultSkySprite;
                groundSF = this.twoXGroundSprite ?? this.defaultGroundSprite;
                laneSF = this.twoXLaneSprite ?? this.defaultLaneSprite;
                laneRightSF = this.twoXRightLaneSprite ?? this.defaultRightLaneSprite;
                // tintColor = Color.fromHEX('#8C52FF');
                break;
            case EObjectType.PowerupShield:
                skySF = this.shieldSkySprite ?? this.defaultSkySprite;
                groundSF = this.shieldGroundSprite ?? this.defaultGroundSprite;
                laneSF = this.shieldLaneSprite ?? this.defaultLaneSprite;
                laneRightSF = this.shieldRightLaneSprite ?? this.defaultRightLaneSprite;
                // tintColor = Color.fromHEX('#00A8E8');
                break;
            default: // EObjectType.None or unknown
                skySF = this.speedSkySprite;
                groundSF = this.defaultGroundSprite;
                laneSF = this.defaultLaneSprite;
                laneRightSF = this.defaultRightLaneSprite;
                // tintColor = Color.WHITE;
                break;
        }

        if (this.skySprite && skySF) {
            this.skySprite.spriteFrame = skySF;
            // this.groundSprite.color = tintColor;
        }

        if (this.groundSprite && groundSF) {
            this.groundSprite.spriteFrame = groundSF;
            // this.groundSprite.color = tintColor;
        }
        if (this.leftLaneSprite && laneSF) {
            this.leftLaneSprite.spriteFrame = laneSF;
            // this.leftLaneSprite.color = tintColor;
        }
        if (this.rightLaneSprite && laneSF) {
            this.rightLaneSprite.spriteFrame = laneRightSF;
            // this.rightLaneSprite.color = tintColor;
        }
    }
}
