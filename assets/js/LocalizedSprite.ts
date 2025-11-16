import { _decorator, Component, Node, Enum, SpriteFrame, Sprite,sys} from 'cc';
import { ETextKey } from './LocalizationData';
import { languageChangeEvent, LocalizationManager } from './LocalizationManager';
const { ccclass, property } = _decorator;

Enum(ETextKey)

@ccclass('LocalizedSprite')
export class LocalizedSprite extends Component {

    @property ({type: SpriteFrame}) englishIcon : SpriteFrame = null;
    @property ({type: SpriteFrame}) arabicIcon : SpriteFrame = null;

    @property ({type: Sprite}) sprite : Sprite = null;

    protected onLoad(): void {
        languageChangeEvent.on('language-changed', this.updateSprite, this);
    }

    protected onDestroy(): void {
        languageChangeEvent.off('language-changed', this.updateSprite, this);
    }

    start() {
        const savedLang = sys.localStorage.getItem('user_language');
        LocalizationManager.instance.setLanguage(savedLang || 'en');
        this.updateSprite();
    }

    updateSprite () {
        if(this.sprite && LocalizationManager.instance){
            this.sprite.spriteFrame = 
            LocalizationManager.instance.getCurrentLanguage() === "en" ? this.englishIcon : this.arabicIcon;
        }
    }
}


