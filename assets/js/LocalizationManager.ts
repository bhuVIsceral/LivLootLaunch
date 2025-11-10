import { _decorator, Component, Node, sys, EventTarget } from 'cc';
import { localizationData, ETextKey } from './LocalizationData';
const { ccclass, property } = _decorator;

// This is an event bus that will broadcast a message when the language changes.
export const languageChangeEvent = new EventTarget();

@ccclass('LocalizationManager')
export class LocalizationManager extends Component {

    public static instance: LocalizationManager = null;

    private currentLanguage: string = 'en';

    onLoad() {
        if (LocalizationManager.instance === null) {
            LocalizationManager.instance = this;
            // Keep this manager alive between scene loads if needed
            // director.addPersistRootNode(this.node); 
        } else {
            this.destroy();
            return;
        }

        // Load the saved language from the user's device, or default to English
        const savedLang = sys.localStorage.getItem('user_language');
        this.setLanguage(savedLang || 'en');
    }

    public setLanguage(lang: string) {
        if (localizationData[lang]) {
            this.currentLanguage = lang;
            sys.localStorage.setItem('user_language', lang);
            console.log(`Language changed to: ${lang}`);
            // Broadcast the change event to all listeners.
            languageChangeEvent.emit('language-changed');
        } else {
            console.warn(`Language '${lang}' not found in data. Defaulting to 'en'.`);
            this.currentLanguage = 'en';
        }
    }

    public getCurrentLanguage(): string {
        return this.currentLanguage;
    }

    public getTranslation(key: ETextKey): string {
        return localizationData[this.currentLanguage][key] || '...';
    }

    public getHorizontalAlign(): number {
        return this.currentLanguage === 'ar' ? 2 : 0; // 2 = RIGHT, 0 = LEFT
    }

    public getFontSizeMultiplayer(): number {
        return this.currentLanguage === 'ar' ? 1.5 : 1; // 2 = RIGHT, 0 = LEFT
    }
}
