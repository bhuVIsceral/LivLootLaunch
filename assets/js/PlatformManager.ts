import { _decorator, Component, sys, warn } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('PlatformManager')
export class PlatformManager extends Component {

    @property({tooltip: "URL for Google play store"})
    androidStoreUrl: string = "https://play.google.com/store/apps/details?id=com.yourapp.id";

    @property({
        tooltip: "The URL for the Apple App Store."
    })
    iosStoreUrl: string = "https://apps.apple.com/app/your-app-name/id123456789";

    @property({
        tooltip: "The URL for the Windows Store or a fallback website."
    })
    windowsStoreUrl: string = "https://www.your-website.com/download";

    @property({
        tooltip: "A fallback URL for any other platform (Mac, Linux, etc.)."
    })
    fallbackUrl: string = "https://www.google.com";

    private userAgent: string = "";

    onLoad() {
        // Get the user agent string as soon as the game loads
        if (navigator) {
            this.userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
        }
    }

    /**
     * This is the public function you will link to your button's click event.
     * It checks the platform and opens the correct URL.
     */
    public openStoreForPlatform() {
        if (!this.userAgent) {
            warn("User agent not found. Opening fallback URL.");
            sys.openURL(this.fallbackUrl);
            return;
        }

        const ua = this.userAgent.toLowerCase();

        // 1. Check for iOS (iPhone, iPad, iPod)
        if (/iphone|ipad|ipod/.test(ua)) {
            console.log("Platform: iOS detected. Opening App Store.");
            sys.openURL(this.iosStoreUrl);
        }
        // 2. Check for Android
        else if (/android/.test(ua)) {
            console.log("Platform: Android detected. Opening Play Store.");
            sys.openURL(this.androidStoreUrl);
        }
        // 3. Check for Windows
        else if (/windows/.test(ua)) {
            console.log("Platform: Windows detected. Opening Windows URL.");
            sys.openURL(this.windowsStoreUrl);
        }
        // 4. Fallback for others (Mac, Linux, etc.)
        else {
            console.log("Platform: Unknown/Fallback. Opening fallback URL.");
            sys.openURL(this.fallbackUrl);
        }
    }
}


