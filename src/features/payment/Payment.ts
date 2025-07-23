import { useCallback, useState } from 'react';
import { getTotalPrice } from '../../components/ProductList/ProductList';
import { useTelegram } from '../../components/hooks/useTelegram';

export function usePayment() {
    const [addedItems, setAddedItems] = useState<any[]>([]);
    const { tg, queryId, user, isLoaded, error, getUserId, isInTelegram, isFunctionAvailable } = useTelegram();
    const serverLink = 'http://80.78.242.12:8000';

    const handleStarsPayment = useCallback(async () => {
        try {
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
                throw new Error('Не удалось определить ID пользователя. Убедитесь, что приложение запущено в Telegram.');
            }

            const totalPrice = getTotalPrice(addedItems);
            
            if (!Number.isInteger(totalPrice) || totalPrice <= 0) {
                throw new Error(`Неверная сумма платежа: ${totalPrice}`);
            }

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
                throw new Error(errorData.details || errorData.error || `Ошибка сервера: ${response.status}`);
            }

            const responseData = await response.json();
            const { invoice_link } = responseData;
            
            if (!invoice_link) {
                throw new Error('Сервер не вернул ссылку на инвойс');
            }
            
            if (typeof tg.openInvoice !== 'function') {
                throw new Error('Метод openInvoice недоступен в этой версии Telegram');
            }
            
            tg.openInvoice(invoice_link, (status: string) => {
                switch (status) {
                    case 'paid':
                        setAddedItems([]);
                        if (tg.MainButton) {
                            tg.MainButton.hide();
                        }
                        tg.showAlert('Оплата прошла успешно!');
                        break;
                    case 'cancelled':
                        tg.showAlert('Оплата отменена');
                        break;
                    case 'failed':
                        tg.showAlert('Ошибка оплаты. Попробуйте еще раз.');
                        break;
                    default:
                        tg.showAlert('Получен неизвестный статус оплаты');
                }
            });

        } catch (error: any) {
            const errorMessage = error.message || 'Неизвестная ошибка';
            
            if (tg && typeof tg.showAlert === 'function') {
                tg.showAlert('Ошибка оплаты ! ? ?: ' + errorMessage);
            } else {
                alert('Ошибка оплаты ! : ' + errorMessage);
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