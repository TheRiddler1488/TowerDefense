import { _decorator, Component, AudioSource, AudioClip } from 'cc';
import { EventBus, EventType, SFXType } from '../Core/EventBus';
const { ccclass, property } = _decorator;

@ccclass('AudioManager')
export class AudioManager extends Component {
    @property(AudioSource) bgmSource: AudioSource = null!;
    @property(AudioSource) sfxSource: AudioSource = null!;

    @property([AudioClip]) sfxClips: AudioClip[] = [];

    private lastPlayedTimes: Map<SFXType, number> = new Map();

    private readonly spamCooldownMs: number = 50;

    protected onLoad() {
        EventBus.on(EventType.GAME_START, this.playBGM, this);
        EventBus.on(EventType.PLAY_SFX, this.playSFX, this);
    }

    private playBGM() {
        if (this.bgmSource && !this.bgmSource.playing) {
            this.bgmSource.play();
        }
    }

    private playSFX(sfxType: SFXType) {
        if (!this.sfxSource || !this.sfxClips[sfxType]) return;

        const currentTime = Date.now();
        const lastPlayed = this.lastPlayedTimes.get(sfxType) || 0;

        if (currentTime - lastPlayed < this.spamCooldownMs) {
            return;
        }

        this.lastPlayedTimes.set(sfxType, currentTime);
        this.sfxSource.playOneShot(this.sfxClips[sfxType]);
    }
}
