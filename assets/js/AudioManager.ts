import { _decorator, Component, Node, AudioClip, AudioSource, sys } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    // --- AUDIO CLIPS ---
    // These properties create slots in the Inspector. We will drag our
    // audio files from the Assets window into these slots.
    @property({ type: AudioClip })
    public bgm: AudioClip | null = null;
    @property({ type: AudioClip })
    public collectChilliSfx: AudioClip | null = null;
    @property({ type: AudioClip })
    public collectPowerupSfx: AudioClip | null = null;
    @property({ type: AudioClip })
    public hitObstacleSfx: AudioClip | null = null;
    @property({ type: AudioClip })
    public failSfx: AudioClip | null = null;
    
    // This will be the component that plays our looping background music.
    private bgmSource: AudioSource | null = null;
    private isMuted : boolean = false;

    // --- LIFE-CYCLE CALLBACKS ---

    onLoad() {
        // Get the AudioSource component that we will add in the editor.
        this.bgmSource = this.getComponent(AudioSource);

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
    
    public playChilliSfx() {
        if (this.collectChilliSfx && this.bgmSource) {
            this.bgmSource.playOneShot(this.collectChilliSfx, .25);
        }
    }

    public playPowerupSfx() {
        if (this.collectPowerupSfx && this.bgmSource) {
            this.bgmSource.playOneShot(this.collectPowerupSfx, .25);
        }
    }

    public playHitSfx() {
        if (this.hitObstacleSfx && this.bgmSource) {
            this.bgmSource.playOneShot(this.hitObstacleSfx, .25);
        }
    }

    public playJumpSfx() {
        if (this.failSfx && this.bgmSource) {
            this.bgmSource.playOneShot(this.failSfx, .25);
        }
    }
}


