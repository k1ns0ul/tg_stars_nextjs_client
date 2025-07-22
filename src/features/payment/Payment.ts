import { useCallback, useState } from 'react';
import { getTotalPrice } from '../../components/ProductList/ProductList';
import { useTelegram } from '../../components/hooks/useTelegram';

export function usePayment() {
    const [addedItems, setAddedItems] = useState<any[]>([]);
    const { tg, queryId, user, isLoaded, error, getUserId, isInTelegram, isFunctionAvailable } = useTelegram();
    const serverLink = 'https://80.78.242.12';

    const handleStarsPayment = useCallback(async () => {
        try {
            console.log('Начало обработки платежа:', {
                isLoaded,
                user,
                addedItemsLength: addedItems?.length,
                isInTelegram: isInTelegram()
            });

            if (!isLoaded) {
                throw new Error('SDK еще не загружен. Попробуйте еще раз.');
            }

            if (!isInTelegram()) {
                throw new Error('Приложение должно быть запущено в Telegram.');
            }

            if (!addedItems || addedItems.length === 0) {
                throw new Error('Корзина пуста');
            }

            if (!tg) {
                throw new Error('Telegram WebApp недоступен');
            }

            const userId = getUserId();
            
            if (!userId) {
                console.error('Отладочная информация:', {
                    user,
                    tgInitData: tg?.initDataUnsafe,
                    webAppData: (window as any)?.Telegram?.WebApp?.initDataUnsafe,
                    isInTelegram: isInTelegram()
                });
                throw new Error('Не удалось определить ID пользователя. Убедитесь, что приложение запущено в Telegram.');
            }

            const totalPrice = getTotalPrice(addedItems);
            
            if (!Number.isInteger(totalPrice) || totalPrice <= 0) {
                throw new Error(`Неверная сумма платежа: ${totalPrice}`);
            }

            console.log('Отправка запроса на создание инвойса:', {
                products: addedItems.length,
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
                const errorData = await response.json().catch(() => ({}));
                console.error('Ошибка ответа сервера:', errorData);
                throw new Error(errorData.details || errorData.error || `Ошибка сервера: ${response.status}`);
            }

            const responseData = await response.json();
            const { invoice_link } = responseData;
            
            console.log('Получена ссылка на инвойс:', invoice_link);
            
            if (!invoice_link) {
                throw new Error('Сервер не вернул ссылку на инвойс');
            }
            
            if (typeof tg.openInvoice !== 'function') {
                throw new Error('Метод openInvoice недоступен в этой версии Telegram');
            }
            
            tg.openInvoice(invoice_link, (status: string) => {
                console.log('Статус оплаты:', status);
                
                switch (status) {
                    case 'paid':
                        console.log('Оплата прошла успешно!');
                        setAddedItems([]);
                        if (tg.MainButton) {
                            tg.MainButton.hide();
                        }
                        tg.showAlert('Оплата прошла успешно!');
                        break;
                    case 'cancelled':
                        console.log('Оплата отменена');
                        tg.showAlert('Оплата отменена');
                        break;
                    case 'failed':
                        console.log('Ошибка оплаты');
                        tg.showAlert('Ошибка оплаты. Попробуйте еще раз.');
                        break;
                    default:
                        console.log('Неизвестный статус:', status);
                        tg.showAlert('Получен неизвестный статус оплаты');
                }
            });

        } catch (error: any) {
            console.error('Ошибка при создании инвойса:', error);
            
            const errorMessage = error.message || 'Неизвестная ошибка';
            
            if (tg && typeof tg.showAlert === 'function') {
                tg.showAlert('Ошибка: ' + errorMessage);
            } else {
                alert('Ошибка: ' + errorMessage);
            }
        }
    }, [addedItems, tg, queryId, user, serverLink, isLoaded, getUserId, isInTelegram]);

    return { 
        addedItems, 
        setAddedItems, 
        handleStarsPayment, 
        tg, 
        queryId, 
        user,
        isLoaded,
        getUserId,
        isInTelegram
    };
}