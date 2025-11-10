import { _decorator, Component, Node, tween, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('CameraShaker')
export class CameraShaker extends Component {

    @property
    public shakeDuration: number = 0.2; // How long the shake lasts
    @property
    public shakeIntensity: number = 10; // How far the camera moves

    private originalPos: Vec3 = new Vec3();
    private isShaking: boolean = false;

    onLoad() {
        // Store the original position of the node this is attached to.
        this.originalPos.set(this.node.position);
    }

    // This public method can be called from other scripts (like our GameManager)
    public shake() {
        if (this.isShaking) {
            return;
        }
        this.isShaking = true;

        // Use the powerful 'tween' system to create the shake animation
        tween(this.node)
            // Shake to the right and up
            .to(this.shakeDuration / 4, { position: new Vec3(this.originalPos.x + this.shakeIntensity, this.originalPos.y + this.shakeIntensity, this.originalPos.z) })
            // Shake to the left and down
            .to(this.shakeDuration / 4, { position: new Vec3(this.originalPos.x - this.shakeIntensity, this.originalPos.y - this.shakeIntensity, this.originalPos.z) })
            // Shake one more time
            .to(this.shakeDuration / 4, { position: new Vec3(this.originalPos.x + this.shakeIntensity / 2, this.originalPos.y, this.originalPos.z) })
            // Return to the original position
            .to(this.shakeDuration / 4, { position: this.originalPos })
            // When the tween is finished, allow shaking again.
            .call(() => {
                this.isShaking = false;
            })
            .start();
    }
}