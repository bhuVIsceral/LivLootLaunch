import { _decorator, Component, CircleCollider2D, Collider2D, IPhysics2DContact, Contact2DType, RigidBody2D } from "cc";
import { GameManager } from "./GameManager";
import { Tagger, EObjectType } from "./Tagger";
import { BlockController, EBlockType } from "./BlockController"; // <-- Import BlockController

const { ccclass, property } = _decorator;

@ccclass('BallController')
export class BallController extends Component {

    private bounceCount: number = 0;
    
    @property({
        tooltip: "The default number of times the ball can bounce before dying."
    })
    private maxBounces: number = 1; // The ball can bounce once by default

    start() {
        const collider = this.getComponent(CircleCollider2D);
        if(collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
        } else {
            console.error("CircleCollider2D not found on Ball!");
        }
    }

    onBeginContact(selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // If the node is already inactive, don't process any more collisions
        if (!this.node.active) return;

        const otherTagger = otherCollider.getComponent(Tagger);
        if (!otherTagger) return;

        switch(otherTagger.tag) {

            case EObjectType.WALL:
                this.handleBounce();
                break;

            case EObjectType.FLOOR:
                this.killBall();
                break;

            case EObjectType.BLOCK :
                // console.log("Ball hit Block" + otherCollider.node.name + " " + otherCollider.getComponent(BlockController).healthLabel.string);
                const blockController1 = otherCollider.getComponent(BlockController); 
                blockController1?.onHit();

                if (blockController1?.getBlockType() === EBlockType.STONE) 
                    this.maxBounces = 0;

                if (blockController1?.getBlockType() === EBlockType.BOOSTER_DOUBLE_BOUNCE) 
                    this.maxBounces++;

                if(blockController1.isCollidable === true )this.handleBounce();
                break;
        }
    }

    private handleBounce() {
        this.bounceCount++;

        if (this.bounceCount > this.maxBounces) {
            this.killBall();
        }
    }

    private killBall() {
        // Ensure this logic only runs once
        if (!this.node.active) return; 
        
        this.scheduleOnce(() => {
            if (!this.node) return; // Node might be destroyed already
            this.node.active = false; 
            GameManager.instance?.onBallOutOfBounds();
            
            this.scheduleOnce(() => {
                this.node.destroy();
            }, 0);
        }, 0);
    }
}