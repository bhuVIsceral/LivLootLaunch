import { _decorator, Component, Node, Prefab, instantiate, Vec3, Vec2, v2, v3, PhysicsSystem2D, UITransform, ERaycast2DType, Collider2D, find } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('TrajectoryController')
export class TrajectoryController extends Component {

    @property({ type: Prefab, tooltip: "The prefab for a single dot in the trajectory line." })
    dotPrefab: Prefab = null;

    @property({ tooltip: "Maximum number of points to draw for the trajectory." })
    maxPoints: number = 20;
    
    @property({ tooltip: "The time interval between each predicted point on the trajectory." })
    timeStep: number = 0.08;

    @property({ tooltip: "Maximum number of bounces to predict." })
    maxBounces: number = 3;

    @property({
        type: Number,
        tooltip: "The physics group index for Walls. Find this in Project -> Project Settings -> Physics -> Grouping.",
        min: 0
    })
    wallGroupIndex: number = 3;

    @property({
        type: Number,
        tooltip: "The physics group index for Tiles. Find this in Project -> Project Settings -> Physics -> Grouping.",
        min: 0
    })
    tileGroupIndex: number = 2;

    @property({
        type: Number,
        tooltip: "The gravity force on the Y-axis. Should match your Project's Physics settings."
    })
    gravityY: number = -320;


    private dots: Node[] = [];
    private uiTransform: UITransform = null;
    private collisionMask: number = 0;
    private gravity: Vec2 = v2(0, 0);

    onLoad() {
        this.uiTransform = this.getComponent(UITransform);
        if (!this.uiTransform) {
            console.error("CRITICAL: The 'Trajectory' node is missing a UITransform component.");
            return;
        }

        if (!this.dotPrefab) {
            console.error("Dot Prefab not assigned in TrajectoryController!");
            return;
        }
        
        const wallMask = 1 << this.wallGroupIndex;
        const tileMask = 1 << this.tileGroupIndex;
        this.collisionMask = wallMask | tileMask;
        this.gravity = v2(0, this.gravityY);

        for (let i = 0; i < this.maxPoints; i++) {
            const dot = instantiate(this.dotPrefab);
            dot.active = false;
            this.node.addChild(dot);
            this.dots.push(dot);
        }
    }

    public showTrajectory(startPos: Vec3, velocity: Vec2) {
        if (this.dots.length === 0 || !this.uiTransform) return;

        this.hideTrajectory();

        let currentPos = v2(startPos.x, startPos.y);
        let currentVel = velocity.clone();
        let bounces = 0;

        for (let i = 0; i < this.maxPoints; i++) {
            // Calculate the potential end position for this time step
            const positionChange = currentVel.clone().multiplyScalar(this.timeStep);
            const endPos = currentPos.clone().add(positionChange);

            const results = PhysicsSystem2D.instance.raycast(currentPos, endPos, ERaycast2DType.Any, this.collisionMask);

            if (results.length > 0) {
                const hit = results[0];
                const hitPoint = hit.point;
                
                // Place the dot at the point of collision
                this.placeDot(i, v3(hitPoint.x, hitPoint.y, 0));
                
                bounces++;
                if (bounces >= this.maxBounces) {
                    break; // Stop simulation after max bounces
                }

                // Update position to the hit point
                currentPos = hitPoint;
                
                // Reflect the velocity vector
                const dotProduct = currentVel.dot(hit.normal);
                currentVel.subtract(hit.normal.multiplyScalar(2 * dotProduct));
                
                // Move slightly away from the wall to avoid immediate re-collision in the next step
                currentPos.add(currentVel.clone().normalize().multiplyScalar(0.1));

            } else {
                // No collision, so move to the calculated end position
                this.placeDot(i, v3(endPos.x, endPos.y, 0));
                currentPos = endPos;
            }

            // Apply gravity to the velocity for the next step's calculation
            currentVel.add(this.gravity.clone().multiplyScalar(this.timeStep));
        }
    }

    private placeDot(index: number, worldPos: Vec3) {
        if (index >= this.dots.length) return;
        const dot = this.dots[index];
        const localPos = this.uiTransform.convertToNodeSpaceAR(worldPos);
        dot.setPosition(localPos);
        dot.active = true;
    }

    public hideTrajectory() {
        for (const dot of this.dots) {
            dot.active = false;
        }
    }
}