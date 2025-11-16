import { _decorator, Component, Node, Prefab, Label, director, Sprite, SpriteFrame, UIOpacity, v3, Button, Color, UITransform, tween, Vec3, instantiate } from "cc";
import { languageChangeEvent, LocalizationManager } from "./LocalizationManager";
import { LevelController } from "./LevelController";
import { PlayerController } from './PlayerController';
import { BlockController } from "./BlockController";
import { CameraShaker } from './CameraShaker';
import { AudioManager } from "./AudioManager";
import { VFXManager } from "./VFXManager";
import { EObjectType } from "./Tagger";

const { ccclass, property } = _decorator;

export enum GameState {
    NONE,
    SPLASH,
    WAITING_FOR_INPUT,
    AIMING,
    BALL_IN_PLAY,
    GAME_OVER,
}

const MAX_LIVES = 3;

@ccclass('GameManager')
export class GameManager extends Component {

    public static instance: GameManager = null;

    // --- NODE REFERENCES ---
    @property({ type: LevelController }) levelController: LevelController | null = null;
    @property({ type: PlayerController }) playerController: PlayerController | null = null;
    @property({ type: AudioManager }) audioManager: AudioManager | null = null;
    @property({ type: VFXManager }) vfxManager: VFXManager | null = null
    @property({ type: CameraShaker }) cameraShaker: CameraShaker | null = null;
    @property({ type: Prefab, tooltip: "Drag the scoreCard prefab here" }) scoreCard: Prefab = null;

    // --- NEW: UI SCREEN REFERENCES ---
    @property({ type: Node }) public startMenu: Node | null = null;
    @property({ type: Node }) public howToPlayUI: Node | null = null;
    @property({ type: Node }) public inGameUI: Node | null = null; 
    @property({ type: Node }) public gameOverMenu: Node | null = null;
    @property({ type: Label }) public finalScoreLabel: Label | null = null;
    
    // --- UI LABEL REFERENCES ---
    @property totalLives: number = 5;
    @property(Label) livesLabel: Label = null;
    @property(Label) scoreLabel: Label = null;

    // --- UI BUTTON REFERENCES ---

    @property({ type: Button }) public muteButton: Button | null = null;
    @property({ type: Sprite }) public muteButtonSprite: Sprite | null = null;
    @property ( { type : [SpriteFrame]}) public muteButtonIcons : SpriteFrame[] = [];
    
    @property({type: Button}) public englishButton: Button | null = null;
    @property({type: Button}) public arabicButton: Button | null = null;

    @property(Node) floorTrigger: Node = null;
    @property(Node) blocksContainer: Node = null;
    @property(Node) scoreCardEndPosition : Node = null;
    
    @property public currentState: GameState = GameState.SPLASH;

    private currentLives: number = 0;
    private score: number = 0;
    private totalBlocks: number = 0;
    private lives: number = MAX_LIVES;
    private currentScoreCard: Node = null

    onLoad() {
        // Singleton Pattern
        if (GameManager.instance === null) {
            GameManager.instance = this;
        } else {
            this.destroy();
            return;
        }
    }

    onDestroy() {
        if (GameManager.instance === this) GameManager.instance = null;
        languageChangeEvent.off('language-changed', this.updateLanguageButtonUIColor, this);
    }

    start() {
        console.log("Restart");
        this.setupMuteButton();
        this.setupLanguageButtons();

        languageChangeEvent.on('language-changed', this.updateLanguageButtonUIColor, this);
        this.updateLanguageButtonUIColor();
        
        this.currentLives = this.totalLives;
        this.score = 0;
        this.totalBlocks = 0; // <-- Renamed from totalTiles
        this.updateUI();

        // Start the game by putting it in the waiting state.
        this.setGameState(GameState.SPLASH);
    }

    update(deltaTime: number) {
        
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

        const arabicLabel = getButtonLabel(this.arabicButton);
        if (arabicLabel) {
            arabicLabel.color = (currentLang === 'ar') ? activeColor : inactiveColor;
        }
    }

    private howToPlay() {
        if (this.startMenu) this.startMenu.active = false;
        if (this.howToPlayUI) this.howToPlayUI.active = true;
        if (this.gameOverMenu) this.gameOverMenu.active = false;
        if (this.inGameUI) this.inGameUI.active = false; 
    }

    private startGame() {
        this.setGameState(GameState.WAITING_FOR_INPUT);
        this.score = 0;
        this.lives = MAX_LIVES;
        this.updateUI();
        
        // Start the background music
        if (this.audioManager) this.audioManager.playBGM();
    }

    public registerBlock(block: BlockController) { // <-- Renamed from registerTile
        this.totalBlocks++;
    }

    public setGameState(newState: GameState) {
        if (this.currentState === newState) return;

        console.log(`Game State changed from ${GameState[this.currentState]} to ${GameState[newState]}`);
        this.currentState = newState;

        switch (this.currentState) {
            case GameState.SPLASH:
                if (this.startMenu) this.startMenu.active = true;
                if (this.howToPlayUI) this.howToPlayUI.active = false;
                if (this.gameOverMenu) this.gameOverMenu.active = false;
                if (this.inGameUI) this.inGameUI.active = false;
                break;
            case GameState.WAITING_FOR_INPUT:
                if (this.startMenu) this.startMenu.active = false;
                if (this.howToPlayUI) this.howToPlayUI.active = false;
                if (this.gameOverMenu) this.gameOverMenu.active = false;
                if (this.inGameUI) this.inGameUI.active = true;
                // When we enter this state, spawn a new ball if we have lives left.
                if (this.currentLives > 0) this.playerController?.spawnNewBall();
                break;
            case GameState.AIMING:
                // Logic when aiming starts (e.g., show trajectory line)
                break;
            case GameState.BALL_IN_PLAY:
                // Logic when ball is launched (e.g., hide trajectory line)
                break;
            case GameState.GAME_OVER:
                if (this.startMenu) this.startMenu.active = false;
                if (this.gameOverMenu) this.gameOverMenu.active = true;
                if (this.howToPlayUI) this.howToPlayUI.active = false;
                if (this.inGameUI) this.inGameUI.active = false;
                this.finalScoreLabel!.string = this.score.toString();
                this.levelController.generateLevel();
                // Logic for game over (e.g., show end screen)
                break;
        }
    }

    public onBallOutOfBounds() {
        if (this.currentState !== GameState.BALL_IN_PLAY) return;
        
        console.log("Ball is out of bounds.");
        this.loseLife();
    }

    private loseLife() {
        this.currentLives--;
        this.updateUI();
        if (this.currentLives <= 0) {
            this.scheduleOnce(() => this.gameOver(false), 2);
        } else {
            // --- FIX ---
            // Don't change state immediately. Schedule it for the next frame.
            // This prevents physics race conditions.
            this.scheduleOnce(this.prepareNextTurn, 1);
        }
    }

    private prepareNextTurn() {
        // This will now run safely in the next frame.
        this.setGameState(GameState.WAITING_FOR_INPUT);
    }

    public addScore(points: number) {
        this.score += points;
        this.updateUI();
    }

    public blockDestroyed(block: BlockController, scoreToAdd: number, blockPosition : Vec3) { // <-- Renamed from tileDestroyed
        this.totalBlocks--;
        this.addScore(scoreToAdd); // Base score
        this.animateScoreUI(scoreToAdd, blockPosition);
        // TODO: Add bonus score based on block.getBlockType()
        
        if (this.totalBlocks <= 0) {
            this.scheduleOnce(() => this.gameOver(true), 2);
        }
    }

    private animateScoreUI(scoreToAdd: number, blockPosition : Vec3) {
        console.log("Score Card location : " + blockPosition);
        if(this.currentState === GameState.GAME_OVER) return;
        
        if (!this.scoreCard) {
            console.error("Bonus Card node is not assigned in the GameManager!");
            return;
        }

        this.currentScoreCard = instantiate(this.scoreCard);
        this.currentScoreCard.getComponent(Label).string = scoreToAdd.toString();
        this.cameraShaker.node.addChild(this.currentScoreCard);

        const opacity = this.currentScoreCard.getComponent(UIOpacity);
        const uiTransform = this.currentScoreCard.getComponent(UITransform);

        if (!opacity || !uiTransform) {
            console.error("Bonus Card is missing UIOpacity or UITransform component!");
            return;
        }

        // --- Define target properties ---
        const startPosition = blockPosition; 
        const endPosition = this.scoreCardEndPosition.getPosition(); 
        const initialScale = v3(0, 0, 0);
        const targetScale = v3(1.5, 1.5, 1.5);
        const fadeInDuration = .5;
        const holdDuration = 1;
        const fadeOutDuration = .5;

        // --- Reset State Immediately ---
        // this.score.active = true; // Make sure it's active
        this.currentScoreCard.setPosition(startPosition);
        this.currentScoreCard.setScale(initialScale);
        opacity.opacity = 0;
        uiTransform.priority = 1001; // Bring to front

        // --- Start the Animation Sequence ---
        tween(this.currentScoreCard)
            // Scale up while fading in
            .parallel(
                tween().to(fadeInDuration, { scale: targetScale }, { easing: 'cubicOut' }),
                tween(opacity).to(fadeInDuration, { opacity: 255 }, { easing: 'cubicOut' })
            )
            // Hold for a moment
            .delay(holdDuration)
            // Fade out
            .then(
                tween(this.currentScoreCard).parallel(
                    tween(opacity).to(fadeOutDuration, { opacity: 0 }, { easing: 'cubicIn' }),
                    tween().to(fadeOutDuration, {position: endPosition}, { easing: 'cubicIn' })
                )
                
            )
            // After fade out, reset scale and hide
            .call(() => {
                this.currentScoreCard.setScale(initialScale);
                tween()
                    .delay(holdDuration)
                // this.addScore(scoreToAdd); // Base score
                // tween()
                //     .delay(holdDuration)
                // this.currentScoreCard.destroy();
                // Optionally make the node inactive again if desired
                // this.bonusCard.active = false;
            })
            .start(); // Don't forget to start the tween!
    }

    private updateUI() {
        if (this.livesLabel) this.livesLabel.string = `x${this.currentLives}`;
        if (this.scoreLabel) this.scoreLabel.string = this.score.toString();
    }

    private gameOver(isWin: boolean) {
        this.setGameState(GameState.GAME_OVER);
        if (this.audioManager) this.audioManager.stopBGM();
        if (isWin) {
            console.log("YOU WIN!");
        } else {
            console.log("GAME OVER");
        }
        director.pause();
    }

    public restartGame() {
        console.log("GAME Reload");
        director.resume();
        // Reloading the scene is the cleanest way to restart
        director.loadScene(director.getScene().name);
    }
}


