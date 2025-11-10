import { _decorator, Component, Graphics, Color } from "cc";
const { ccclass, property } = _decorator;

// Game constants for perspective, matching our old game
const GAME_BASE_WIDTH = 540;
const GAME_BASE_HEIGHT = 960;
const LANES = [-120, 0, 120];
const PERSPECTIVE = {
    LANE_SCALE_TOP: 1.5,
    LANE_SCALE_BOTTOM: 0.5,
    LANE_SCALE_EXP: 1.2,
};

@ccclass("LaneRenderer")
export class LaneRenderer extends Component {
    start() {
        // 'start' is a special Cocos function that runs once when the scene loads.
        // It's the perfect place to draw our static lines.

        // First, we need to get the Graphics component that we will add in the editor.
        const graphics = this.getComponent(Graphics);
        if (!graphics) {
            console.error(
                "Please add a Graphics component to the LaneRenderer node in the editor."
            );
            return;
        }

        // Configure the line style
        graphics.lineWidth = 10;
        graphics.strokeColor = new Color(255, 255, 255, 204); // White with some transparency

        // Draw the two lane dividers
        this.drawCurvedLine(0, 1, graphics);
        this.drawCurvedLine(1, 2, graphics);

        // This tells the graphics component to actually draw what we've defined.
        graphics.stroke();
    }

    // This helper function draws one of the curved lines.
    private drawCurvedLine(lane1: number, lane2: number, graphics: Graphics) {
        graphics.moveTo(this.getMidX(lane1, lane2, 0), 0);

        // We draw the line segment by segment to create the curve
        for (let y = 10; y <= GAME_BASE_HEIGHT; y += 10) {
            const midX = this.getMidX(lane1, lane2, y);
            graphics.lineTo(midX, y);
        }
    }

    // This calculates the midpoint between two lanes at a specific Y position
    private getMidX(lane1: number, lane2: number, y: number): number {
        const x1 = this.laneCenterXAtY(lane1, y);
        const x2 = this.laneCenterXAtY(lane2, y);
        return x1 + (x2 - x1) / 2;
    }

    // --- The same perspective math from our old game ---

    private laneScaleAtY(y: number): number {
        const t = Math.min(1, Math.max(0, y / GAME_BASE_HEIGHT));
        const k = Math.pow(t, PERSPECTIVE.LANE_SCALE_EXP);
        return (
            PERSPECTIVE.LANE_SCALE_TOP +
            (PERSPECTIVE.LANE_SCALE_BOTTOM - PERSPECTIVE.LANE_SCALE_TOP) * k
        );
    }

    public laneCenterXAtY(laneIndex: number, y: number): number {
        const screenCenterX = 0; 
        return screenCenterX + LANES[laneIndex] * this.laneScaleAtY(y);
    }
}
