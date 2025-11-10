import { _decorator, Component, Enum } from 'cc';
const { ccclass, property } = _decorator;

// This is an enum. It's a special type that lets us create a set of named constants.
// Cocos Creator will automatically turn this into a dropdown menu in the editor!
export enum EObjectType {
    None,
    Chilli,
    Obstacle,
    PowerupSpeed,
    PowerupMagnet,
    Powerup2x,
    PowerupShield,
}
// This makes the enum available in the editor's "Add Property" menu.
Enum(EObjectType);

@ccclass('Tagger')
export class Tagger extends Component {
    
    // By making a property of the enum's type, we get a dropdown in the Inspector.
    @property({ type: EObjectType })
    public tag: EObjectType = EObjectType.None;
}
