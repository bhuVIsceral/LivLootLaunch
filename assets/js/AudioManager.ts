import { _decorator, Component, Node, AudioClip, AudioSource, sys, director, Enum } from 'cc';
const { ccclass, property } = _decorator;

export enum ESFXType {
    COIN,
    EXPLODE,
    GLASS,
    POWERUP,
    SHOT,
    STRETCH,
}
// Make the enum available in the Inspector
Enum(ESFXType);

@ccclass('AudioManager')
export class AudioManager extends Component {

    // public static instance: AudioManager = null;
    // --- AUDIO CLIPS ---
    // These properties create slots in the Inspector. We will drag our
    // audio files from the Assets window into these slots.
    @property({ type: AudioClip })
    public bgm: AudioClip | null = null;
    @property({ type: AudioClip })
    public coinSfx: AudioClip | null = null;
    @property({ type: AudioClip })
    public explodeSfx: AudioClip | null = null;
    @property({ type: AudioClip })
    public glassSfx: AudioClip | null = null;
    @property({ type: AudioClip })
    public powerupSfx: AudioClip | null = null;
    @property({ type: AudioClip })
    public shotFiredSfx: AudioClip | null = null;
    @property({ type: AudioClip })
    public stretchSfx: AudioClip | null = null;
    
    @property({ type: AudioSource })
    public bgmSource: AudioSource | null = null;
    
    @property({ type: AudioSource })
    public sfxSource: AudioSource | null = null;
    
    
    // This will be the component that plays our looping background music.
    // private bgmSource: AudioSource | null = null;
    // private sfxSource: AudioSource | null = null;
    private isMuted : boolean = false;

    // --- LIFE-CYCLE CALLBACKS ---

    onLoad() {
        // Get the AudioSource component that we will add in the editor.
        // director.addPersistRootNode(this.node); 
        // if (AudioManager.instance === null) {
        //     AudioManager.instance = this;
        // } else {
        //     this.destroy();
        //     return;
        // }

        // this.bgmSource = this.getComponent(AudioSource);

        const savedMuteState = sys.localStorage.getItem('user_is_muted');
        this.isMuted = savedMuteState === 'true';

        this.applyMuteState();
    }

    public toggleMute(): boolean {
        this.isMuted = !this.isMuted;
        sys.localStorage.setItem('user_is_muted', this.isMuted.toString());
        this.applyMuteState();
        return this.isMuted;
    }

    private applyMuteState() {
        if (this.bgmSource) {
            this.bgmSource.volume = this.isMuted ? 0 : 1;
        }
        if (this.sfxSource) {
            this.sfxSource.volume = this.isMuted ? 0 : 1;
        }
    }

    public isCurrentlyMuted() : boolean {
        return this.isMuted;
    }

    public playBGM() {
        if (this.bgmSource && this.bgm) {
            this.bgmSource.clip = this.bgm;
            this.bgmSource.loop = true;
            this.bgmSource.play();
        }
    }
    
    public stopBGM() {
        if (this.bgmSource) {
            this.bgmSource.stop();
        }
    }

    // --- ONE-SHOT SFX METHODS ---
    // These methods play a sound once. They are more reliable for SFX
    // because they use the AudioSource's playOneShot method.

    public playSFX(sfx : ESFXType)
    {
        if (this.sfxSource) {
            this.sfxSource.stop();
            switch (sfx){
                case ESFXType.COIN:
                    this.playCoinSfx();
                    break;
                case ESFXType.EXPLODE:
                    this.playExplodeSfx();
                    break;
                case ESFXType.GLASS:
                    this.playGlassSfx();
                    break;
                case ESFXType.POWERUP:
                    this.playPowerupSfx();
                    break;
                case ESFXType.SHOT:
                    this.playShotFiredSfx();
                    break;
                case ESFXType.STRETCH:
                    this.playStretchSfx();
                    break;
                default:
                    break;
            }
        }
    }
    
    playCoinSfx() {
        if (this.coinSfx && this.sfxSource) {
            this.sfxSource.playOneShot(this.coinSfx, 1.0);
        }
    }

    playExplodeSfx() {
        if (this.explodeSfx && this.sfxSource) {
            this.sfxSource.playOneShot(this.explodeSfx, .25);
        }
    }

    playGlassSfx() {
        if (this.glassSfx && this.sfxSource) {
            this.sfxSource.playOneShot(this.glassSfx, 1.0);
        }
    }

    playPowerupSfx() {
        if (this.powerupSfx && this.sfxSource) {
            this.sfxSource.playOneShot(this.powerupSfx, 1.0);
        }
    }
    
    playShotFiredSfx() {
        if (this.shotFiredSfx && this.sfxSource) {
            this.sfxSource.playOneShot(this.shotFiredSfx, 1.0);
        }
    }

    playStretchSfx() {
        if (this.stretchSfx && this.sfxSource) {
            this.sfxSource.playOneShot(this.stretchSfx, .25);
        }
    }
}


