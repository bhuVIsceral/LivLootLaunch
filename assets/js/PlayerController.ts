import { _decorator, Component, Node, Prefab, instantiate, Vec3, input, Input, EventTouch, Vec2, RigidBody2D, v2, v3, Camera, director, UITransform } from "cc";
import { GameManager, GameState } from "./GameManager";
import { TrajectoryController } from "./TrajectoryController";
import { SlingshotVisuals } from "./SlingshotVisuals";
import { AudioManager } from "./AudioManager";

const { ccclass, property } = _decorator;

@ccclass('PlayerController')
export class PlayerController extends Component {

    @property({type: AudioManager})
    audioManager : AudioManager = null;

    @property({ type: Prefab, tooltip: "Drag the Ball prefab here" })
    ballPrefab: Prefab = null;

    @property({ type: Node, tooltip: "Drag an empty node from the slingshot's center here" })
    slingshotAnchor: Node = null;

    @property({ type: SlingshotVisuals, tooltip: "The script that draws the slingshot bands." })
    slingshotVisuals: SlingshotVisuals = null;

    @property({ type: TrajectoryController, tooltip: "Drag the Trajectory node here" })
    trajectory: TrajectoryController = null;

    @property({ tooltip: "Multiplier for the launch force." })
    launchPower: number = 2.5;

    @property({ type: Camera, tooltip: "The main game camera used for coordinate conversion" })
    mainCamera: Camera = null;

    private currentBall: Node = null;
    private startDragPos: Vec2 = v2();

    public spawnNewBall() {
        if (!this.ballPrefab || !this.slingshotAnchor) {
            console.error("Ball Prefab or Slingshot Anchor not assigned in PlayerController!");
            return;
        }

        if (this.currentBall) {
            this.currentBall.destroy();
        }

        this.currentBall = instantiate(this.ballPrefab);
        this.currentBall.active = true;
        this.node.parent.addChild(this.currentBall);
        this.currentBall.setWorldPosition(this.slingshotAnchor.getWorldPosition());

        const rb = this.currentBall.getComponent(RigidBody2D);
        if (rb) {
            this.scheduleOnce(() => {
                if (rb && rb.isValid) {
                    rb.sleep();
                }
            }, 0);
        }
    }
    
    onLoad() {
        this.registerInputEvents();
        this.trajectory?.hideTrajectory();
    }

    onDestroy() {
        this.unregisterInputEvents();
    }
    
    registerInputEvents() {
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    unregisterInputEvents() {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchCancel, this);
    }

    onTouchStart(event: EventTouch) {
        if (GameManager.instance?.currentState !== GameState.WAITING_FOR_INPUT || !this.currentBall) {
            return;
        }
        GameManager.instance.setGameState(GameState.AIMING);
        this.slingshotVisuals?.startAim(this.currentBall);
        this.startDragPos = event.getUILocation();
        this.audioManager.playStretchSfx();
    }

    onTouchMove(event: EventTouch) {
        if (GameManager.instance?.currentState !== GameState.AIMING || !this.currentBall) {
            return;
        }

        const currentDragPos = event.getUILocation();
        
        const launchVector = this.startDragPos.clone().subtract(currentDragPos);
        const velocity = v2(launchVector.x, launchVector.y).multiplyScalar(this.launchPower);
        
        if (launchVector.lengthSqr() > 100) {
            this.trajectory?.showTrajectory(this.slingshotAnchor.getWorldPosition(), velocity);
        } else {
            this.trajectory?.hideTrajectory();
        }
    }

    onTouchEnd(event: EventTouch) {
        if (GameManager.instance?.currentState !== GameState.AIMING || !this.currentBall) {
            return;
        }

        this.trajectory?.hideTrajectory();
        this.slingshotVisuals?.endAim();

        const endDragPos = event.getUILocation();
        const launchVector = this.startDragPos.clone().subtract(endDragPos);

        if (launchVector.lengthSqr() < 100) { 
            GameManager.instance.setGameState(GameState.WAITING_FOR_INPUT);
            if (this.currentBall) {
                this.currentBall.setWorldPosition(this.slingshotAnchor.getWorldPosition());
            }
            return;
        }

        GameManager.instance.setGameState(GameState.BALL_IN_PLAY);
        
        const rb = this.currentBall.getComponent(RigidBody2D);
        if (rb) {
            rb.wakeUp();
            const velocity = v2(launchVector.x, launchVector.y).multiplyScalar(this.launchPower);
            // rb.applyLinearImpulseToCenter(velocity, true);
            rb.linearVelocity = velocity;
            this.audioManager.playShotFiredSfx();
        }

        this.currentBall = null;
    }

    onTouchCancel(event: EventTouch) {
        if (GameManager.instance?.currentState === GameState.AIMING) {
            this.trajectory?.hideTrajectory();
            this.slingshotVisuals?.endAim();
            GameManager.instance.setGameState(GameState.WAITING_FOR_INPUT);
        }
    }
}