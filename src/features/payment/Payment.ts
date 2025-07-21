import { useCallback, useState } from 'react';
import { getTotalPrice } from '../../components/ProductList/ProductList';
import { useTelegram } from '../../components/hooks/useTelegram';

export function usePayment() {
    const [addedItems, setAddedItems] = useState<any[]>([]);
    const { tg, queryId, user } = useTelegram();
    
    const serverLink = 'http://80.78.242.12'

    const handleStarsPayment = useCallback(async () => {
        try {
            const totalPrice = getTotalPrice(addedItems);

            const response = await fetch(serverLink + '/create-invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },

                body: JSON.stringify({
                    products: addedItems,
                    totalPrice: totalPrice,
                    currency: 'XTR',
                    queryId,
                    userId: user?.id
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Ошибка создания инвойса');
            }

            const { invoice_link } = await response.json();

            if (tg) {
                tg.openInvoice(invoice_link, (status: any) => {
                    if (status === 'paid') {
                        console.log('Оплата прошла успешно!');
                        setAddedItems([]);
                        tg.MainButton.hide();
                        tg.showAlert('Оплата прошла успешно!');
                    } else if (status === 'cancelled') {
                        console.log('Оплата отменена');
                    } else if (status === 'failed') {
                        console.log('Ошибка оплаты');
                        tg.showAlert('Ошибка оплаты');
                    }
                });
            }
        } catch (error: any) {
            console.error('Ошибка при создании инвойса');
            if (tg) {
                tg.showAlert('Ошибка при создании инвойса: ' + error.message);
            }
        }
    }, [addedItems, tg, queryId, user, serverLink]);

    return {
        addedItems,
        setAddedItems,
        handleStarsPayment,
        tg,
        queryId,
        user
    };
}