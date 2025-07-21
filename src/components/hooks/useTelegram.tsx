import { useEffect, useState } from "react";

export function useTelegram() {
    const [tg, setTg] = useState<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            import('@twa-dev/sdk').then((module) => {
                const telegramSDK = module.default;
                setTg(telegramSDK);
                telegramSDK.ready();
                
                setIsLoaded(true);
            }).catch((error) => {
                console.error('Failed to load Telegram SDK:', error);
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
        user: tg?.initDataUnsafe?.user,
        queryId: tg?.initDataUnsafe?.query_id,
        isLoaded, 
    };
}