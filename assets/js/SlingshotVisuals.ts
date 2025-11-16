import { _decorator, Component, Node, Graphics, Camera, director, Canvas, v3, Vec3, Vec2, v2 } from 'cc';

const { ccclass, property } = _decorator;

/**
 * Draws the "bow string" lines from two anchor points to the drag position.
 * Attach this to a node that has a Graphics component.
 */
@ccclass('SlingshotVisuals')
export class SlingshotVisuals extends Component {

    @property({
        type: Node,
        tooltip: "The world-space anchor for the left 'fork' of the slingshot."
    })
    anchorLeft: Node = null;

    @property({
        type: Node,
        tooltip: "The world-space anchor for the right 'fork' of the slingshot."
    })
    anchorRight: Node = null;

    @property({
        tooltip: "The thickness of the slingshot bands."
    })
    lineWidth: number = 5;

    private graphics: Graphics = null;
    private mainCamera: Camera = null;
    private canvasNode: Node = null;

    // The anchor points converted to local UI space (for drawing)
    private localAnchorLeft: Vec3 = v3();
    private localAnchorRight: Vec3 = v3();

    private isAiming: boolean = false;
    private currentDragPos_Screen: Vec2 = v2();
    private ballToTrack: Node = null;

    onLoad() {
        this.graphics = this.getComponent(Graphics);
        if (!this.graphics) {
            console.error("SlingshotVisuals requires a Graphics component on the same node!");
            return;
        }

        this.mainCamera = director.getScene()?.getComponentInChildren(Camera);
        const canvas = director.getScene()?.getComponentInChildren(Canvas);
        if (canvas) {
            this.canvasNode = canvas.node;
        }

        if (!this.mainCamera || !this.canvasNode) {
            console.error("SlingshotVisuals could not find the Camera or Canvas!");
            return;
        }

        this.graphics.lineWidth = this.lineWidth;

        // Calculate the local anchor positions once
        this.calculateLocalAnchors();
    }

    /**
     * Converts the world-space anchor nodes to the local UI space for the Graphics component.
     */
    calculateLocalAnchors() {
        if (!this.anchorLeft || !this.anchorRight) return;

        // Convert left anchor
        const worldPosLeft = this.anchorLeft.getWorldPosition();
        this.mainCamera.convertToUINode(worldPosLeft, this.canvasNode, this.localAnchorLeft);
        
        // Convert right anchor
        const worldPosRight = this.anchorRight.getWorldPosition();
        this.mainCamera.convertToUINode(worldPosRight, this.canvasNode, this.localAnchorRight);
    }

    /**
     * Call this to begin drawing the bands.
     */
    public startAim(ball : Node) {
        this.ballToTrack = ball;
        this.isAiming = true;
    }

    /**
     * Call this to stop drawing the bands.
     */
    public endAim() {
        this.isAiming = false;
        this.ballToTrack = null;
        this.graphics?.clear();
    }

    /**
     * Call this from your PlayerController's onTouchMove to update the drag position.
     * @param screenPos The touch position from event.getLocation()
     */
    public updateDragPosition() {
        // this.currentDragPos_Screen = screenPos;
    }

    /**
     * lateUpdate runs after all other updates, ensuring the line is drawn
     * at the very end of the frame.
     */
    lateUpdate() {
        this.graphics?.clear();
        if (!this.isAiming || !this.graphics || !this.ballToTrack || !this.mainCamera || !this.canvasNode) return;

        const ballWorldPos = this.ballToTrack.getWorldPosition();

        // Convert the current screen-space drag position to our local UI space
        const tempLocalDragPos = v3();
        this.mainCamera.convertToUINode(ballWorldPos, this.canvasNode, tempLocalDragPos);
        
        // Draw the left band
        this.graphics.moveTo(this.localAnchorLeft.x, this.localAnchorLeft.y);
        this.graphics.lineTo(tempLocalDragPos.x, tempLocalDragPos.y);
        
        // Draw the right band
        this.graphics.moveTo(this.localAnchorRight.x, this.localAnchorRight.y);
        this.graphics.lineTo(tempLocalDragPos.x, tempLocalDragPos.y);

        // Apply the drawing
        this.graphics.stroke();
    }
}