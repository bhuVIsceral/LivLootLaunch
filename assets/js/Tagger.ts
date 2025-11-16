import { _decorator, Component, Enum } from 'cc';
import { BlockController } from './BlockController';
const { ccclass, property } = _decorator;

// An enum to define all the object types we care about for collisions.
export enum EObjectType {
    NONE = 0,
    BALL = 1,
    BLOCK = 2,
    FLOOR = 7,
    WALL = 8,
}
// This makes the enum available in the Cocos Creator editor's Inspector.
Enum(EObjectType);

@ccclass('Tagger')
export class Tagger extends Component {
    @property({ 
        type: EObjectType, 
        tooltip: "Assign a specific type to this game object for collision detection." 
    })
    public tag: EObjectType = EObjectType.NONE;
}