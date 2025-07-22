import { useEffect, useState } from "react";

export function useTelegram() {
    const [tg, setTg] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [queryId, setQueryId] = useState<string | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [initData, setInitData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initTelegram = async () => {
            try {
                const WebApp = (await import('@twa-dev/sdk')).default;
                
                const isTelegram = WebApp.isExpanded !== undefined;
                
                if (isTelegram) {
                    WebApp.ready();
                    WebApp.expand();
                    
                    setTg(WebApp);
                    
                    if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
                        const userData = WebApp.initDataUnsafe.user;
                        setUser(userData);
                        setQueryId(WebApp.initDataUnsafe.query_id || null);
                        setInitData(WebApp.initDataUnsafe);
                        setError(null);
                    } else {
                        setError('Данные пользователя недоступны из Telegram');
                    }
                } else {
                    setError('Приложение должно быть запущено в Telegram');
                }
                
            } catch (err: any) {
                setError('Ошибка загрузки Telegram SDK: ' + err.message);
            } finally {
                setIsLoaded(true);
            }
        };

        initTelegram();
    }, []);

    const getUserId = () => {
        if (tg?.initDataUnsafe?.user?.id) {
            return tg.initDataUnsafe.user.id.toString();
        }
        
        if (user?.id) {
            return user.id.toString();
        }
        
        return null;
    };

    // ИСПРАВЛЕНО: Проверяем только наличие Telegram WebApp, а не user.id
    const isInTelegram = () => {
        return !!(tg && tg.isExpanded !== undefined);
    };

    const isFunctionAvailable = (functionName: string) => {
        return tg && typeof tg[functionName] === 'function';
    };

    const onClose = () => {
        if (isFunctionAvailable('close')) {
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

    const openInvoice = (invoiceLink: string, callback: (status: string) => void) => {
        if (isFunctionAvailable('openInvoice')) {
            tg.openInvoice(invoiceLink, callback);
        } else {
            callback('failed');
        }
    };

    const showAlert = (message: string) => {
        if (isFunctionAvailable('showAlert')) {
            tg.showAlert(message);
        } else {
            alert(message);
        }
    };

    const showConfirm = (message: string, callback: (result: boolean) => void) => {
        if (isFunctionAvailable('showConfirm')) {
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
        error,
        getUserId,
        isInTelegram,
        isFunctionAvailable,
    };
}