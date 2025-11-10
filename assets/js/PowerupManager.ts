import { _decorator, Component } from 'cc';
import { EObjectType } from './Tagger';
const { ccclass, property } = _decorator;

// We define the properties of our power-ups here
const POWERUP_CONFIG: Map<EObjectType, { duration: number }> = new Map([
    [EObjectType.PowerupSpeed, { duration: 4 }],
    [EObjectType.PowerupMagnet, { duration: 6 }],
    [EObjectType.Powerup2x, { duration: 10 }],
    [EObjectType.PowerupShield, { duration: 8 }],
]);

// A simple interface to describe an active power-up
interface IActivePowerup {
    type: EObjectType;
    duration: number;
    timeLeft: number;
    activationTime: number; // NEW: To track which was activated most recently
}

@ccclass('PowerupManager')
export class PowerupManager extends Component {
    
    private activePowerups: Map<EObjectType, IActivePowerup> = new Map();
    // NEW: Keep track of the last powerup type activated
    private _lastActivatedPowerupType: EObjectType = EObjectType.None;

    update(deltaTime: number) {
        let anyPowerupDeactivated = false;
        for (const [key, powerup] of this.activePowerups.entries()) {
            powerup.timeLeft -= deltaTime;
            if (powerup.timeLeft <= 0) {
                this.activePowerups.delete(key);
                anyPowerupDeactivated = true;
            }
        }
        // If a powerup deactivated, or if the last activated one is gone, recalculate
        if (anyPowerupDeactivated || !this.isActive(this._lastActivatedPowerupType)) {
            this.updateLastActivatedPowerup();
        }
    }

    public activatePowerup(powerupType: EObjectType) {
        const config = POWERUP_CONFIG.get(powerupType);
        if (config) {
            this.activePowerups.set(powerupType, {
                type: powerupType,
                duration: config.duration,
                timeLeft: config.duration,
                activationTime: Date.now(), // Store activation time
            });
            this.updateLastActivatedPowerup(); // Update which one is "dominant"
            console.log(`Activated power-up: ${EObjectType[powerupType]}`);
        }
    }

    public deactivatePowerup(powerupType: EObjectType) {
        if (this.activePowerups.has(powerupType)) {
            this.activePowerups.delete(powerupType);
            this.updateLastActivatedPowerup(); // Update which one is "dominant"
            console.log(`Deactivated power-up: ${EObjectType[powerupType]}`);
        }
    }

    public isActive(powerupType: EObjectType): boolean {
        return this.activePowerups.has(powerupType);
    }
    
    // This method is for the UI, to get the remaining time as a percentage.
    public getProgress(powerupType: EObjectType): number {
        const powerup = this.activePowerups.get(powerupType);
        if (powerup) {
            return powerup.timeLeft / powerup.duration;
        }
        return 0;
    }

    // NEW: Public function to get the currently dominant active power-up
    public getDominantActivePowerup(): EObjectType {
        return this._lastActivatedPowerupType;
    }

    // NEW: Internal helper to find the most recently active powerup
    private updateLastActivatedPowerup() {
        let mostRecentType: EObjectType = EObjectType.None;
        let mostRecentTime: number = -1;

        for (const [_, powerup] of this.activePowerups.entries()) {
            if (powerup.activationTime > mostRecentTime) {
                mostRecentTime = powerup.activationTime;
                mostRecentType = powerup.type;
            }
        }
        this._lastActivatedPowerupType = mostRecentType;
    }
}