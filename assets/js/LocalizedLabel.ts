import { _decorator, Component, Node, Label, Enum , sys } from 'cc';
import { ETextKey } from './LocalizationData';
import { languageChangeEvent, LocalizationManager } from './LocalizationManager';
const { ccclass, property } = _decorator;

// This makes our ETextKey enum show up as a dropdown in the editor
Enum(ETextKey);

@ccclass('LocalizedLabel')
export class LocalizedLabel extends Component {

    // This property will be a dropdown in the Inspector
    @property({ type: ETextKey })
    private textKey: ETextKey = ETextKey.PLAY;

    @property()
    private updateHorizontalAlign: boolean = false;

    @property()
    private defaultFontSize: number = 20;

    private label: Label | null = null;

    onLoad() {
        this.label = this.getComponent(Label);
        // Listen for the language change event
        languageChangeEvent.on('language-changed', this.updateText, this);
    }

    start() {
        // Set the initial text when the game starts
        const savedLang = sys.localStorage.getItem('user_language');
        LocalizationManager.instance.setLanguage(savedLang || 'en');
        this.updateText();
    }
    
    onDestroy() {
        // Clean up the listener
        languageChangeEvent.off('language-changed', this.updateText, this);
    }

    private updateText() {
        if (this.label && LocalizationManager.instance) {
            this.label.string = LocalizationManager.instance.getTranslation(this.textKey);
            this.label.fontSize = this.defaultFontSize * LocalizationManager.instance.getFontSizeMultiplayer();
            if(this.updateHorizontalAlign) this.label.horizontalAlign = LocalizationManager.instance.getHorizontalAlign();
        }
    }
}
