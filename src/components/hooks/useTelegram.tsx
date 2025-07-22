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
                console.log('=== ИНИЦИАЛИЗАЦИЯ TELEGRAM WEBAPP ===');
                
                const WebApp = (await import('@twa-dev/sdk')).default;
                
                console.log('SDK импортирован:', {
                    version: WebApp.version,
                    platform: WebApp.platform,
                    isExpanded: WebApp.isExpanded
                });
                
                const isTelegram = WebApp.isExpanded !== undefined;
                
                if (isTelegram) {
                    console.log('Приложение запущено в Telegram');
                    
                    WebApp.ready();
                    WebApp.expand();
                    
                    setTg(WebApp);
                    
                    console.log('initDataUnsafe:', WebApp.initDataUnsafe);
                    console.log('initData:', WebApp.initData);
                    
                    if (WebApp.initDataUnsafe && WebApp.initDataUnsafe.user) {
                        const userData = WebApp.initDataUnsafe.user;
                        
                        console.log('Данные пользователя найдены:', userData);
                        
                        setUser(userData);
                        setQueryId(WebApp.initDataUnsafe.query_id || null);
                        setInitData(WebApp.initDataUnsafe);
                        setError(null);
                        
                    } else {
                        console.error('Данные пользователя недоступны');
                        setError('Данные пользователя недоступны из Telegram');
                    }
                } else {
                    console.warn('Приложение не запущено в Telegram');
                    setError('Приложение должно быть запущено в Telegram');
                }
                
            } catch (err: any) {
                console.error('Ошибка инициализации Telegram:', err);
                setError('Ошибка загрузки Telegram SDK: ' + err.message);
            } finally {
                setIsLoaded(true);
            }
        };

        initTelegram();
    }, []);

    const getUserId = () => {
       
        
        if (user?.id) {
            return user.id;
        }
        
        if (tg?.initDataUnsafe?.user?.id) {
            console.log('ID найден в tg.initDataUnsafe:', tg.initDataUnsafe.user.id);
            return tg.initDataUnsafe.user.id;
        }
        
        if (tg?.initData) {
            console.log('Парсинг initData строки:', tg.initData);
            try {
                const params = new URLSearchParams(tg.initData);
                const userString = params.get('user');
                if (userString) {
                    const userObj = JSON.parse(decodeURIComponent(userString));
                    if (userObj.id) {
                        console.log('ID найден при парсинге:', userObj.id);
                        return userObj.id;
                    }
                }
            } catch (e) {
                console.error('Ошибка парсинга initData:', e);
            }
        }
        
        console.log('User ID не найден');
        return null;
    };

    const isInTelegram = () => {
        return !!(tg && tg.isExpanded !== undefined && user?.id);
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
            console.error('openInvoice недоступен');
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