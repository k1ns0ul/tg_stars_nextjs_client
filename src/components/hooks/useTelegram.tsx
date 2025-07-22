import { useEffect, useState } from "react";

export function useTelegram() {
    const [tg, setTg] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [queryId, setQueryId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('@twa-dev/sdk').then((module) => {
                const telegramSDK = module.default;
                
                telegramSDK.ready();
                
                setTg(telegramSDK);
                
                setUser(telegramSDK.initDataUnsafe?.user || null);
                setQueryId(telegramSDK.initDataUnsafe?.query_id || null);
                
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
    }, []);

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
        if (tg) {
            tg.openInvoice(invoiceLink, callback);
        }
    };

    const showAlert = (message: any) => {
        if (tg) {
            tg.showAlert(message);
        }
    };

    const showConfirm = (message: any, callback: any) => {
        if (tg) {
            tg.showConfirm(message, callback);
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
    };
}