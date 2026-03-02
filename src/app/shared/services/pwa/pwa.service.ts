import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PwaService {
    private deferredPrompt: any;
    showInstallButton = false;
    private platform = 'WEB';

    constructor() {
        if (typeof window === 'undefined') {
            return; // SSR: no hacer nada
        }

        this.checkPlatform();

        // Si la app ya está en modo standalone (ya instalada), no mostrar botón
        if (this.isRunningStandalone()) {
            this.showInstallButton = false;
            return;
        }

        this.initPwaPrompt();
    }

    get currentPlatform() {
        return this.platform;
    }

    /**
     * Detecta si la app ya está corriendo como PWA instalada (standalone)
     */
    private isRunningStandalone(): boolean {
        // iOS standalone
        if (('standalone' in window.navigator) && (window.navigator as any).standalone) {
            return true;
        }
        // Android/Desktop standalone via display-mode media query
        if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
            return true;
        }
        return false;
    }

    private checkPlatform() {
        if (typeof navigator === 'undefined') return;

        const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;

        if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
            this.platform = 'IOS';
            if (!this.isRunningStandalone()) {
                this.showInstallButton = true;
            }
        } else if (/Android/i.test(userAgent)) {
            this.platform = 'ANDROID';
        } else {
            this.platform = 'DESKTOP';
        }
    }

    private initPwaPrompt() {
        // 1. Recuperar evento capturado globalmente antes de que Angular arrancara
        if ((window as any).__pwaInstallPrompt) {
            this.deferredPrompt = (window as any).__pwaInstallPrompt;
            this.showInstallButton = true;
            if (this.platform === 'WEB') {
                this.platform = 'DESKTOP';
            }
            // Limpiar referencia global
            delete (window as any).__pwaInstallPrompt;
        }

        // 2. Escuchar futuros eventos (por si el usuario cancela y el browser vuelve a dispararlo)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallButton = true;
        });

        // 3. Cuando se instala, ocultar botón
        window.addEventListener('appinstalled', () => {
            this.showInstallButton = false;
            this.deferredPrompt = null;
        });
    }

    /**
     * Triggers the install prompt or returns true if manual guide is needed (iOS)
     */
    async installPwa(): Promise<boolean> {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                this.deferredPrompt = null;
                this.showInstallButton = false;
            }
            return false; // Handled automatically
        }
        // If no deferred prompt (e.g. iOS), return true to show manual guide
        return true;
    }
}
