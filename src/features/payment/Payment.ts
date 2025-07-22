import { useCallback, useState } from 'react';
import { getTotalPrice } from '../../components/ProductList/ProductList';
import { useTelegram } from '../../components/hooks/useTelegram';

export function usePayment() {
    const [addedItems, setAddedItems] = useState<any[]>([]);
    const { tg, queryId, user, isLoaded } = useTelegram();
    const serverLink = 'https://80.78.242.12';

    const handleStarsPayment = useCallback(async () => {
        try {
            console.log('Начало обработки платежа:', {
                isLoaded,
                user,
                userId: user?.id,
                addedItemsLength: addedItems?.length
            });

            if (!isLoaded) {
                throw new Error('sdk еще не загружен');
            }

            if (!addedItems || addedItems.length === 0) {
                throw new Error('Корзина пуста');
            }

            if (!tg) {
                throw new Error('Telegram WebApp недоступен');
            }

            let userId = null;
            
            if (user?.id) {
                userId = user.id;
            } else if (tg?.initDataUnsafe?.user?.id) {
                userId = tg.initDataUnsafe.user.id;
            } else {
                const webApp = (window as any)?.Telegram?.WebApp;
                if (webApp?.initDataUnsafe?.user?.id) {
                    userId = webApp.initDataUnsafe.user.id;
                }
            }

            if (!userId) {
                console.error('Данные пользователя:', {
                    user,
                    tgInitData: tg?.initDataUnsafe,
                    webAppData: (window as any)?.Telegram?.WebApp?.initDataUnsafe
                });
                throw new Error('Не удалось определить ID пользователя. Убедитесь, что приложение запущено в Telegram.');
            }

            const totalPrice = getTotalPrice(addedItems);
            
            if (!Number.isInteger(totalPrice) || totalPrice <= 0) {
                throw new Error(`Неверная сумма платежа: ${totalPrice}`);
            }

            console.log('Отправка запроса на создание инвойса:', {
                products: addedItems,
                totalPrice,
                queryId,
                userId
            });

            const response = await fetch(serverLink + '/create-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products: addedItems,
                    totalPrice: totalPrice,
                    queryId,
                    userId: userId
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Ошибка ответа сервера:', errorData);
                throw new Error(errorData.details || errorData.error || 'Ошибка создания инвойса');
            }

            const { invoice_link } = await response.json();
            
            console.log('Получена ссылка на инвойс:', invoice_link);
            
            if (tg && invoice_link) {
                if (typeof tg.openInvoice !== 'function') {
                    throw new Error('Метод openInvoice недоступен');
                }
                
                tg.openInvoice(invoice_link, (status : any) => {
                    console.log('Статус оплаты:', status);
                    
                    if (status === 'paid') {
                        console.log('Оплата прошла успешно!');
                        setAddedItems([]);
                        tg.MainButton.hide();
                        tg.showAlert('Оплата прошла успешно!');
                    } else if (status === 'cancelled') {
                        console.log('Оплата отменена');
                        tg.showAlert('Оплата отменена');
                    } else if (status === 'failed') {
                        console.log('Ошибка оплаты');
                        tg.showAlert('Ошибка оплаты');
                    } else {
                        console.log('Неизвестный статус:', status);
                    }
                });
            } else {
                throw new Error('Telegram WebApp недоступен или некорректная ссылка на инвойс');
            }
        } catch (error : any) {
            console.error('Ошибка при создании инвойса:', error);
            if (tg) {
                tg.showAlert('Ошибка при создании инвойса: ' + error.message);
            } else {
                alert('Ошибка при создании инвойса: ' + error.message);
            }
        }
    }, [addedItems, tg, queryId, user, serverLink, isLoaded]);

    return { 
        addedItems, 
        setAddedItems, 
        handleStarsPayment, 
        tg, 
        queryId, 
        user,
        isLoaded
    };
}