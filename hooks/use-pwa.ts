import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

interface PWAInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<PWAInstallPromptEvent | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [hasPendingSync, setHasPendingSync] = useState(false);

  useEffect(() => {
    // Apenas executa no navegador web
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    }

    // Detectar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Listener para evento de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as PWAInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listener para quando app é instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Listeners de conectividade
    const handleOnline = () => {
      setIsOnline(true);
      // Tentar sincronizar dados pendentes
      if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration: any) => {
          return registration.sync?.register('sync-health-data');
        }).catch((error) => {
          console.error('Erro ao registrar sincronização:', error);
        });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar status de conectividade inicial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        setDeferredPrompt(null);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    if (Platform.OS !== 'web' || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão de notificação:', error);
      return false;
    }
  };

  const subscribeToPushNotifications = async () => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Verificar se já existe uma inscrição
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Criar nova inscrição
        const vapidPublicKey = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY || '';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as any,
        });
      }
      
      return subscription;
    } catch (error) {
      console.error('Erro ao se inscrever em notificações push:', error);
      return null;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    hasPendingSync,
    installPWA,
    requestNotificationPermission,
    subscribeToPushNotifications,
  };
}

// Função auxiliar para registrar Service Worker
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    
    console.log('[PWA] Service Worker registrado:', registration.scope);
    
    // Verificar atualizações
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[PWA] Nova versão disponível! Recarregue a página.');
            // Pode mostrar notificação para o usuário atualizar
          }
        });
      }
    });
    
    return registration;
  } catch (error) {
    console.error('[PWA] Erro ao registrar Service Worker:', error);
    return null;
  }
}

// Função auxiliar para converter VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}
