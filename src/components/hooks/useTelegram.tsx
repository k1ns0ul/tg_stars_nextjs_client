import { useEffect, useState } from "react";

export function useTelegram() {
    const [tg, setTg] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [queryId, setQueryId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [initData, setInitData] = useState<any>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const webApp = (window as any)?.Telegram?.WebApp;
            if (webApp) {
                console.log('Используем нативный Telegram WebApp API');
                webApp.ready();
                
                setTg(webApp);
                setUser(webApp.initDataUnsafe?.user || null);
                setQueryId(webApp.initDataUnsafe?.query_id || null);
                setInitData(webApp.initDataUnsafe || null);
                setIsLoaded(true);
                
                console.log('Native Telegram WebApp loaded:', {
                    user: webApp.initDataUnsafe?.user,
                    queryId: webApp.initDataUnsafe?.query_id,
                    initData: webApp.initDataUnsafe
                });
            } else {
                import('@twa-dev/sdk').then((module) => {
                    const telegramSDK = module.default;
                    
                    telegramSDK.ready();
                    
                    setTg(telegramSDK);
                    setUser(telegramSDK.initDataUnsafe?.user || null);
                    setQueryId(telegramSDK.initDataUnsafe?.query_id || null);
                    setInitData(telegramSDK.initDataUnsafe || null);
                    setIsLoaded(true);
                    
                    console.log('Telegram SDK loaded:', {
                        user: telegramSDK.initDataUnsafe?.user,
                        queryId: telegramSDK.initDataUnsafe?.query_id,
                        initData: telegramSDK.initDataUnsafe
                    });
                    
                }).catch((error) => {
                    console.error('Failed to load Telegram SDK:', error);
                    setIsLoaded(true); 
                });
            }
        }
    }, []);

    const getUserId = () => {
        if (user?.id) {
            return user.id;
        }
        
        if (tg?.initDataUnsafe?.user?.id) {
            return tg.initDataUnsafe.user.id;
        }
        
        const webApp = (window as any)?.Telegram?.WebApp;
        if (webApp?.initDataUnsafe?.user?.id) {
            return webApp.initDataUnsafe.user.id;
        }
        
        return null;
    };

    const isInTelegram = () => {
        return !!(
            (window as any)?.Telegram?.WebApp || 
            tg?.initDataUnsafe || 
            user?.id
        );
    };

    const onClose = () => {
        if (tg) {
            tg.close();
        }
    };

    const onToggleButton = () => {
        if (tg && tg.MainButton) {
            if (tg.MainButton.isVisible) {
                tg.MainButton.hide();
            } else {
                tg.MainButton.show();
            }
        }
    };

    const openInvoice = (invoiceLink: any, callback: any) => {
        if (tg && typeof tg.openInvoice === 'function') {
            tg.openInvoice(invoiceLink, callback);
        } else {
            console.error('openInvoice method not available');
        }
    };

    const showAlert = (message: any) => {
        if (tg && typeof tg.showAlert === 'function') {
            tg.showAlert(message);
        } else {
            alert(message);
        }
    };

    const showConfirm = (message: any, callback: any) => {
        if (tg && typeof tg.showConfirm === 'function') {
            tg.showConfirm(message, callback);
        } else {
            const result = confirm(message);
            callback(result);
        }
    };

    return {
        onClose,
        onToggleButton,
        openInvoice,
        showAlert,
        showConfirm,
        tg,
        user,
        queryId,
        isLoaded,
        initData,
        getUserId,
        isInTelegram,
    };
}