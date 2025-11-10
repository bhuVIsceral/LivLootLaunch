import { _decorator, Component, Node, Label, director, Sprite, SpriteFrame, UIOpacity, v3, Button, Color, UITransform, tween, Vec3 } from "cc";
import { languageChangeEvent, LocalizationManager } from "./LocalizationManager";
import { PlayerController } from "./PlayerController";
import { Spawner } from "./Spawner";
import { CameraShaker } from './CameraShaker';
import { AudioManager } from "./AudioManager";
import { PowerupManager } from "./PowerupManager";
import { EObjectType } from "./Tagger";
import { VFXManager } from "./VFXManager";
import { EnvironmentManager } from './EnvironmentManager'; // NEW import
import { PlayerVFX } from './PlayerVFX';

const { ccclass, property } = _decorator;

// --- CONFIG CONSTANTS ---
// We can move some config values here for clarity
const INITIAL_GAME_SPEED = 300;
const MAX_GAME_SPEED = 800;
const MAX_LIVES = 3;
const CHILLI_SCORE = 1;

// Difficulty Scaling Rules
const TIME_TO_SCALE = 40; // seconds
const CHILLIES_TO_SCALE = 50;

const SCORE_THRESHOLDS = [50, 100, 150, 200, 250, 300];
const DISCOUNT_LEVELS = [5, 10, 15, 20, 25, 30];
// --- NEW: Bonus Constants ---
const POWERUP_COLLECTION_BONUS = 50;
const TOTAL_POWERUP_TYPES = 4; // Speed, Magnet, 2x, Shield

@ccclass("GameManager")
export class GameManager extends Component {
    // --- SINGLETON PATTERN ---
    public static instance: GameManager = null;

    public currentGameSpeed: number = INITIAL_GAME_SPEED;

    // --- NODE REFERENCES ---
    // We will drag our nodes from the scene into these slots in the editor.
    @property({ type: PlayerController }) public playerController: PlayerController | null = null;
    @property({ type: Spawner }) public spawner: Spawner | null = null;
    @property({ type: CameraShaker }) public cameraShaker: CameraShaker | null = null;
    @property({ type: AudioManager }) public audioManager: AudioManager | null = null;
    @property({ type: PowerupManager }) public powerupManager: PowerupManager | null = null;
    @property({ type: VFXManager }) public vfxManager: VFXManager | null = null;
    @property({ type: EnvironmentManager }) public environmentManager: EnvironmentManager | null = null;
    @property({ type: PlayerVFX }) public playerVFX: PlayerVFX | null = null;

    // --- NEW: UI MENU REFERENCES ---
    @property({ type: Node }) public startMenu: Node | null = null;
    @property({ type: Node }) public howToPlayUI: Node | null = null;
    @property({ type: Node }) public howToPlayUIPage01: Node | null = null;
    @property({ type: Node }) public howToPlayUIPage02: Node | null = null;
    @property({ type: Node }) public gameOverMenu: Node | null = null;
    @property({ type: Node }) public inGameUI: Node | null = null; // A parent node for all in-game UI
    @property({ type: Label }) public finalScoreLabel: Label | null = null;

    // --- UI REFERENCES ---
    @property({ type: Label }) public scoreLabel: Label | null = null;
    @property({ type: Node }) public livesContainer: Node | null = null;

    @property({ type: Button }) public muteButton: Button | null = null;
    @property({ type: Sprite }) public muteButtonSprite: Sprite | null = null;
    @property ( { type : [SpriteFrame]}) public muteButtonIcons : SpriteFrame[] = [];
    
    @property({type: Button}) public englishButton: Button | null = null;
    @property({type: Button}) public arabicButton: Button | null = null;

    // --- POWERUP UI ---
    // References for the UI cards to show their active state
    @property({ type: Node }) public powerupCardSpeed: Node | null = null;
    @property({ type: Node }) public powerupCardMagnet: Node | null = null;
    @property({ type: Node }) public powerupCard2x: Node | null = null;
    @property({ type: Node }) public powerupCardShield: Node | null = null;
    @property({ type: Node }) public bonusCard: Node | null = null;

    // --- NEW: References for Copy Code ---
    @property({ type: Label }) public discountLabel: Label | null = null;
    @property({ type: Label }) public discountCodeLabel: Label | null = null;
    @property({ type: Button }) public copyCodeButton: Button | null = null;

    // --- GAME STATE ---
    private gameState: "menu" | "playing" | "gameOver" = "menu";
    private gameSpeed: number = INITIAL_GAME_SPEED;
    private score = 0;
    private lives: number = MAX_LIVES;

    // --- DIFFICULTY TRACKING ---
    private timeElapsed = 0;
    private chilliesCollectedSinceLastScale = 0;
    private speedMilestones = 0;
    private currentDiscountCode: string = ''; // Store the generated code

    private baseGameSpeed: number = INITIAL_GAME_SPEED;

    // --- NEW: Set to track unique powerups collected in this cycle ---
    private collectedPowerupTypes: Set<EObjectType> = new Set();
    
    onLoad() {
        // Set up the singleton instance
        if (GameManager.instance === null) {
            GameManager.instance = this;
        } else {
            this.destroy(); // Destroy any duplicate instances
            return;
        }
    }

    onDestroy() {
        if (GameManager.instance === this) GameManager.instance = null;
        languageChangeEvent.off('language-changed', this.updateLanguageButtonUIColor, this);
    }

    start() {
        this.setupMuteButton();
        this.setupLanguageButtons();
        this.setupCopyCodeButton();
        languageChangeEvent.on('language-changed', this.updateLanguageButtonUIColor, this);
        this.updateLanguageButtonUIColor();

        // Start in the menu state
        this.gameState = "menu";
        // Ensure the game is reset
        // this.startGame();
        if (this.startMenu) this.startMenu.active = true;
        if (this.howToPlayUI) this.howToPlayUI.active = false;
        if (this.gameOverMenu) this.gameOverMenu.active = false;
        if (this.inGameUI) this.inGameUI.active = false;

    }
    update(deltaTime: number) {
        if (this.gameState !== "playing") return;
        // Update the game speed based on difficulty scaling
        // --- CENTRALIZED VISUAL UPDATE LOGIC ---
        const dominantPowerup = this.powerupManager?.getDominantActivePowerup() ?? EObjectType.None;

        // Tell the EnvironmentManager to update its look
        this.environmentManager?.updateVisuals(dominantPowerup);

        // Tell the GameManager to update its own UI elements (cards, multiplier icon)
        this.updatePowerupUI(); // Pass the dominant type

        this.updateDifficulty(deltaTime);
        this.currentGameSpeed = this.calculateCurrentSpeed();
        // Update the UI every frame
        // this.updatePowerupUI();
    }

    private setupMuteButton() {
        if(this.muteButton && this.audioManager) {
            this.updateMuteButtonLabel();
            this.muteButton.node.on('click', () => {
                this.audioManager.toggleMute();
                this.updateMuteButtonLabel();
            }, this);
        }
    }

    private updateMuteButtonLabel() {
        if(this.muteButtonSprite && this.audioManager) {
            const isMuted = this.audioManager.isCurrentlyMuted();
            this.muteButtonSprite.spriteFrame = isMuted ? this.muteButtonIcons[0] : this.muteButtonIcons[1];
        }
    }

    private setupLanguageButtons() {
        if (this.englishButton) {
            this.englishButton.node.on('click', () => {
                LocalizationManager.instance.setLanguage('en');
            }, this);
        }
        if (this.arabicButton) {
            this.arabicButton.node.on('click', () => {
                LocalizationManager.instance.setLanguage('ar');
            }, this);
        }
        // if (this.hinglishButton) {
        //     this.hinglishButton.node.on('click', () => {
        //         LocalizationManager.instance.setLanguage('en_HI');
        //     }, this);
        // }
    }

     private updateLanguageButtonUIColor() {
        if (!LocalizationManager.instance) return;

        const currentLang = LocalizationManager.instance.getCurrentLanguage();
        const activeColor = new Color(255, 200, 0); // A nice mustard color
        const inactiveColor = new Color(128, 128, 128); // Grey

        // Helper function to get the Label component from a Button
        const getButtonLabel = (button: Button | null): Label | null => {
            return button ? button.getComponentInChildren(Label) : null;
        }
        
        const englishLabel = getButtonLabel(this.englishButton);
        if (englishLabel) {
            englishLabel.color = (currentLang === 'en') ? activeColor : inactiveColor;
        }

        const hindiLabel = getButtonLabel(this.arabicButton);
        if (hindiLabel) {
            hindiLabel.color = (currentLang === 'ar') ? activeColor : inactiveColor;
        }

        // const hinglishLabel = getButtonLabel(this.hinglishButton);
        // if (hinglishLabel) {
        //     hinglishLabel.color = (currentLang === 'en_HI') ? activeColor : inactiveColor;
        // }
    }

    private howToPlay() {
        if (this.startMenu) this.startMenu.active = false;
        if (this.howToPlayUI) this.howToPlayUI.active = true;
        if (this.gameOverMenu) this.gameOverMenu.active = false;
        if (this.inGameUI) this.inGameUI.active = false;        
        this.showHowToPlayPage1();
    }

    private startGame() {
        this.gameState = 'playing';
        if (this.startMenu) this.startMenu.active = false;
        if (this.howToPlayUI) this.howToPlayUI.active = false;
        if (this.gameOverMenu) this.gameOverMenu.active = false;
        if (this.inGameUI) this.inGameUI.active = true;

        this.baseGameSpeed = INITIAL_GAME_SPEED;
        this.score = 0;
        this.lives = MAX_LIVES;
        this.gameSpeed = INITIAL_GAME_SPEED;
        this.timeElapsed = 0;
        this.chilliesCollectedSinceLastScale = 0;
        this.speedMilestones = 0;
        this.collectedPowerupTypes.clear(); // --- NEW: Reset collected types ---
        this.updateScoreUI();
        this.updateLivesUI();

        // Start the background music
        if (this.audioManager) this.audioManager.playBGM();
    }

    private updateDifficulty(deltaTime: number) {
        this.timeElapsed += deltaTime;

        const expectedMilestones =
            Math.floor(this.timeElapsed / TIME_TO_SCALE) +
            Math.floor(
                this.chilliesCollectedSinceLastScale / CHILLIES_TO_SCALE
            );

        if (expectedMilestones > this.speedMilestones) {
            const milestonesToApply = expectedMilestones - this.speedMilestones;
            for (let i = 0; i < milestonesToApply; i++) this.baseGameSpeed *= 1.10;
            this.baseGameSpeed = Math.min(this.baseGameSpeed, MAX_GAME_SPEED);

            console.log(`Difficulty increased! New speed: ${this.baseGameSpeed}`);

            this.speedMilestones = expectedMilestones;
        }
    }

    private calculateCurrentSpeed(): number {
        let speed = this.baseGameSpeed;
        if (this.powerupManager?.isActive(EObjectType.PowerupSpeed)) {
            speed *= 2;
        }
        return speed;
    }
    
    public onPlayerHitObstacle() {
        if (this.gameState !== 'playing') return;

        // --- THIS IS THE SHIELD LOGIC CHANGE ---
        if (this.powerupManager?.isActive(EObjectType.PowerupShield)) {            
            console.log("Shield blocked hit!");
            return; // Stop processing the hit - player does not lose life
        }
        // --- If shield was NOT active, proceed with normal hit logic ---
        if (this.audioManager) this.audioManager.playHitSfx();
        this.vfxManager?.playHitEffect();
        if (this.cameraShaker) this.cameraShaker.shake();
        this.lives--;
        this.updateLivesUI();
        // if (this.playerVFX && this.powerupManager) {
        //     this.playerVFX.playVFX(this.powerupManager.getDominantActivePowerup());
        // }
        if (this.lives <= 0) this.endGame();
    }

    public onPlayerCollectChilli() {
        if (this.gameState !== "playing") return;
        if (this.audioManager) this.audioManager.playChilliSfx();

        const multiplier = this.powerupManager?.isActive(EObjectType.Powerup2x) ? 2 : 1;
        this.score += CHILLI_SCORE * multiplier;

        this.chilliesCollectedSinceLastScale++;
        this.updateScoreUI();

        // --- Tell PlayerVFX to play using the current dominant powerup ---
        if (this.playerVFX && this.powerupManager) {
            this.playerVFX.playVFX(this.powerupManager.getDominantActivePowerup());
        }
    }

    public onPlayerCollectPowerUp(powerUpType: EObjectType) {
        if (this.gameState !== "playing") return;
        this.vfxManager?.playCollectEffect();
        if (this.audioManager) this.audioManager.playPowerupSfx();
        this.powerupManager?.activatePowerup(powerUpType);

        // --- NEW: Track collected type and check for bonus ---
        this.collectedPowerupTypes.add(powerUpType);
        console.log(`Collected types: ${this.collectedPowerupTypes.size} / ${TOTAL_POWERUP_TYPES}`);

        if (this.collectedPowerupTypes.size === TOTAL_POWERUP_TYPES) {
            this.score += POWERUP_COLLECTION_BONUS;
            this.collectedPowerupTypes.clear(); // Reset for the next cycle
            this.animateBonusUI();
            this.updateScoreUI();
            console.log(`All power-ups collected! +${POWERUP_COLLECTION_BONUS} points!`);
            // // Optionally: Play a special bonus sound or effect
            // this.audioManager?.playChilliSfx(); // Placeholder bonus sound
            // if(this.playerController && this.vfxManager) {
            //      this.vfxManager.playCollectEffect(); // Bonus VFX
            // }
        }

        // --- Tell PlayerVFX to play using the NEW dominant powerup ---
        // Note: activatePowerup already updated the dominant one internally
        if (this.playerVFX && this.powerupManager) {
            this.playerVFX.playVFX(this.powerupManager.getDominantActivePowerup());
        }
    }

    // Replace the existing animateBonusUI function with this one

    private animateBonusUI() {
        if (!this.bonusCard) {
            console.error("Bonus Card node is not assigned in the GameManager!");
            return;
        }

        const opacity = this.bonusCard.getComponent(UIOpacity);
        const uiTransform = this.bonusCard.getComponent(UITransform);

        if (!opacity || !uiTransform) {
            console.error("Bonus Card is missing UIOpacity or UITransform component!");
            return;
        }

        // --- Define target properties ---
        const startPosition = v3(0, 0, 0); 
        const endPosition = v3(150, 320, 0); 
        const initialScale = v3(0, 0, 0);
        const targetScale = v3(1.5, 1.5, 1.5);
        const fadeInDuration = .5;
        const holdDuration = 1;
        const fadeOutDuration = .5;

        // --- Reset State Immediately ---
        this.bonusCard.active = true; // Make sure it's active
        this.bonusCard.setPosition(startPosition);
        this.bonusCard.setScale(initialScale);
        opacity.opacity = 0;
        uiTransform.priority = 1001; // Bring to front

        // --- Start the Animation Sequence ---
        tween(this.bonusCard)
            // Scale up while fading in
            .parallel(
                tween().to(fadeInDuration, { scale: targetScale }, { easing: 'cubicOut' }),
                tween(opacity).to(fadeInDuration, { opacity: 255 }, { easing: 'cubicOut' })
            )
            // Hold for a moment
            .delay(holdDuration)
            // Fade out
            .then(
                tween(this.bonusCard).parallel(
                    tween(opacity).to(fadeOutDuration, { opacity: 0 }, { easing: 'cubicIn' }),
                    tween().to(fadeOutDuration, {position: endPosition}, { easing: 'cubicIn' })
                )
                
            )
            // After fade out, reset scale and hide
            .call(() => {
                this.bonusCard.setScale(initialScale);
                // Optionally make the node inactive again if desired
                // this.bonusCard.active = false;
            })
            .start(); // Don't forget to start the tween!
    }

    // --- And make sure Vec3 and UIOpacity are imported ---
    // Add Vec3 and UIOpacity to your import from 'cc' at the top
    // import { _decorator, Component, Node, ..., Vec3, UIOpacity } from 'cc';

    // private animateBonusUI()
    // {
    //     const opacity = this.bonusCard.getComponent(UIOpacity);
    //     const uiTransform = this.bonusCard.getComponent(UITransform);

    //     if(opacity && uiTransform)
    //     {
    //         uiTransform.priority = 1001;
    //         tween(opacity)
    //             .to(0, {opacity: 255}, {easing: 'linear'})
    //             .start();
    //         tween(this.bonusCard)
    //             .to(0, {scale: new Vec3(0, 0, 0)}, {easing: 'linear'})
    //             .start();
    //     }

    //     if(opacity && uiTransform)
    //     {
    //         uiTransform.priority = 1001;
    //         tween(this.bonusCard)
    //             .to(.05, {worldPosition: new Vec3(270, 480, 0)}, {easing: 'cubicIn'})
    //             .start();
    //         tween(this.bonusCard)
    //             .to(.35, {scale: new Vec3(2, 2, 2)}, {easing: 'cubicIn'})
    //             .start();
    //         tween(opacity)
    //             .to(1, {opacity: 0}, {easing: 'cubicIn'})
    //             .start();
    //     }
    // }

    // --- UI Update Methods ---
    private updateScoreUI() {
        if (this.scoreLabel) {
            this.scoreLabel.string = Math.floor(this.score).toString();
        }
    }

    private updateLivesUI() {
        if (this.livesContainer) {
            this.livesContainer.children.forEach((lifeIcon, index) => {
                lifeIcon.active = index < this.lives;
            });
        }
    }

    private updatePowerupUI() {
        if (!this.powerupManager) return;

        // Update each card's active state and progress bar
        const updateCard = (card: Node | null, key: EObjectType) => {
            if (card) {
                const isActive = this.powerupManager.isActive(key);
                const activeGlow = card.getChildByName('ActiveGlow');
                if (activeGlow) activeGlow.active = isActive;

                const progressBarNode = card.getChildByName('ProgressBar');
                if (progressBarNode) {
                    const opacityComp = progressBarNode.getComponent(UIOpacity);
                    if (opacityComp) {
                        console.log(progressBarNode + isActive.toString());
                        opacityComp.opacity = isActive ? 255 : 0;
                    }

                    const spriteComp = progressBarNode.getComponent(Sprite);
                    if (spriteComp) {
                        spriteComp.fillRange = this.powerupManager.getProgress(key);
                    }
                }
            }
        };

        updateCard(this.powerupCardSpeed, EObjectType.PowerupSpeed);
        updateCard(this.powerupCardMagnet, EObjectType.PowerupMagnet);
        updateCard(this.powerupCard2x, EObjectType.Powerup2x);
        updateCard(this.powerupCardShield, EObjectType.PowerupShield);
    }

    private calculateDiscount(score: number): number {
        let finalDiscount = 5; // Default discount
        // Loop through the score thresholds
        for (let i = 0; i < SCORE_THRESHOLDS.length; i++) {
            // If the player's score meets or exceeds the threshold...
            if (score >= SCORE_THRESHOLDS[i]) {
                // ...set the discount to the corresponding level
                finalDiscount = DISCOUNT_LEVELS[i];
            }
        }
        // Return the highest discount level achieved
        return finalDiscount;
    }

    private endGame() {
        this.gameState = "gameOver";
        if (this.audioManager) this.audioManager.stopBGM();
        console.log("Game Over!");

        const discountPercent = this.calculateDiscount(this.score);
        // --- UPDATED: Generate and store the code ---
        `HUNTERS-${Math.floor(this.score)}-${Date.now().toString().slice(-6)}`;
        // this.generateQRCode(this.currentDiscountCode); // Use the stored code
        if (this.discountLabel) {
            const paddedPercent = discountPercent.toString();
            this.discountLabel.string = `HH#${paddedPercent}%`;
        }
        this.currentDiscountCode = this.discountLabel.string;
        if (this.discountCodeLabel) this.discountCodeLabel.string = this.currentDiscountCode;

        if (this.gameOverMenu) this.gameOverMenu.active = true;
        if (this.howToPlayUI) this.howToPlayUI.active = false;
        if (this.inGameUI) this.inGameUI.active = false;
        if (this.finalScoreLabel) this.finalScoreLabel.string = Math.floor(this.score).toString();
    }

    // --- NEW: Function to handle the copy button click ---
    private copyDiscountCode() {
        if (!this.currentDiscountCode) return;

        // Try the modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(this.currentDiscountCode)
                .then(() => {
                    this.showCopiedFeedback();
                })
                .catch(err => {
                    console.error('Modern clipboard write failed: ', err);
                    // If it fails, try the fallback
                    this.copyUsingExecCommand();
                });
        } 
        // If the modern API isn't even available, go straight to fallback
        else {
            console.warn('Clipboard API not available, trying fallback.');
            this.copyUsingExecCommand();
        }
    }

    // --- NEW: Fallback function using execCommand ---
    private copyUsingExecCommand() {
        try {
            // Create a temporary textarea element
            const textArea = document.createElement("textarea");
            textArea.value = this.currentDiscountCode;

            // Make it invisible and append it to the body
            textArea.style.position = "fixed"; 
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.width = "2em";
            textArea.style.height = "2em";
            textArea.style.padding = "0";
            textArea.style.border = "none";
            textArea.style.outline = "none";
            textArea.style.boxShadow = "none";
            textArea.style.background = "transparent";
            document.body.appendChild(textArea);
            
            // Select the text and copy it
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            
            // Remove the temporary element
            document.body.removeChild(textArea);

            if (successful) {
                this.showCopiedFeedback();
            } else {
                console.error('Fallback copy command failed.');
                 // Optionally: Show an error message to the user
            }
        } catch (err) {
            console.error('Error during fallback copy: ', err);
             // Optionally: Show an error message to the user
        }
    }

    // --- NEW: Helper function for showing feedback ---
    private showCopiedFeedback() {
        console.log('Discount code copied to clipboard!');
        if (this.copyCodeButton) {
            const originalLabel = this.copyCodeButton.getComponentInChildren(Label);
            if (originalLabel) {
                const originalText = originalLabel.string;
                originalLabel.string = LocalizationManager.instance.getCurrentLanguage() === 'en' ? "COPIED!" : "تم النسخ!";
                // Make sure we are not already scheduling this
                this.unscheduleAllCallbacks(); 
                this.scheduleOnce(() => { originalLabel.string = originalText; }, 1.5);
            }
        }
    }
    
    // --- NEW: Function to set up the copy button listener ---
    private setupCopyCodeButton() {
        if (this.copyCodeButton) {
            this.copyCodeButton.node.on('click', this.copyDiscountCode, this);
        }
    }

    // --- Public method for the Restart button ---
    public restartGame() {
        // Reloading the scene is the cleanest way to restart
        director.loadScene("hunter_dash");
    }

    public showHowToPlayPage1() {
        if (this.howToPlayUIPage01) this.howToPlayUIPage01.active = true;
        if (this.howToPlayUIPage02) this.howToPlayUIPage02.active = false;
    }

    public showHowToPlayPage2() {
        if (this.howToPlayUIPage01) this.howToPlayUIPage01.active = false;
        if (this.howToPlayUIPage02) this.howToPlayUIPage02.active = true;
    }
}
