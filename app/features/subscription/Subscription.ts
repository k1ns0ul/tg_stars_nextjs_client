import { useCallback, useState } from "react";
import { useTelegram } from "@/components/hooks/useTelegram";
import { getTotalSubPrice } from "@/components/ProductList/ProductList";

export function useSubscription() {
    const [subPlan, setAddedSubs] = useState<any[]>([]);
    const { tg, queryId, user, isLoaded, error, getUserId, isInTelegram} = useTelegram();

    const handleSubscription = useCallback(async () => {
        try {
            if (!isLoaded) {
                throw new Error('SDK еще не загружен. Попробуйте еще раз.');
            }

            if (!isInTelegram()) {
                throw new Error('Приложение должно быть запущено в Telegram.');
            }

            if (!tg) {
                throw new Error('Telegram WebApp недоступен');
            }

            const userId = getUserId();
            
            if (!userId) {
                throw new Error('Не удалось определить ID пользователя. Убедитесь, что приложение запущено в Telegram.');
            }

            const totalPrice = getTotalSubPrice(subPlan);
                        
            if (!Number.isInteger(totalPrice) || totalPrice <= 0) {
                throw new Error(`Неверная сумма платежа: ${totalPrice}`);
            }

            const response = await fetch('/api/create-stars-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    products: subPlan,
                    queryId,
                    userId: userId,
                    // Период подписки в секундах (30 дней)
                    subscription_period: 30 * 24 * 60 * 60,
                    amount: (subPlan),
                    currency: 'XTR' // Telegram Stars
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
                        if (tg.MainButton) {
                            tg.MainButton.hide();
                        }
                        tg.showAlert('Подписка успешно оформлена! Оплата будет автоматически списываться каждый месяц.');
                        break;
                    case 'cancelled':
                        tg.showAlert('Оформление подписки отменено');
                        break;
                    case 'failed':
                        tg.showAlert('Ошибка оплаты подписки. Попробуйте еще раз.');
                        break;
                    default:
                        tg.showAlert('Получен неизвестный статус оплаты');
                }
            });

        } catch(error : any) {
            const errorMessage = error.message || 'Неизвестная ошибка';
            
            if (tg && typeof tg.showAlert === 'function') {
                tg.showAlert('Ошибка оформления подписки: ' + errorMessage);
            } else {
                alert('Ошибка оформления подписки: ' + errorMessage);
            }
        }
    }, [subPlan, tg, queryId, user, isLoaded, getUserId, isInTelegram]);

    const manageSubscription = useCallback(async (subscriptionId: string, action: 'cancel' | 'reactivate') => {
        try {
            const response = await fetch('/api/manage-stars-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscriptionId,
                    action,
                    userId: getUserId()
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.details || errorData.error || `Ошибка сервера: ${response.status}`);
            }

            const actionText = action === 'cancel' ? 'отменена' : 'возобновлена';
            tg.showAlert(`Подписка успешно ${actionText}`);

        } catch(error: any) {
            const errorMessage = error.message || 'Неизвестная ошибка';
            tg.showAlert('Ошибка управления подпиской: ' + errorMessage);
        }
    }, [tg, getUserId]);

    const getSubscriptions = useCallback(async () => {
        try {
            const response = await fetch('/api/get-stars-subscriptions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: getUserId()
                })
            });

            if (!response.ok) {
                throw new Error(`Ошибка получения подписок: ${response.status}`);
            }

            const data = await response.json();
            return data.subscriptions || [];

        } catch(error: any) {
            console.error('Ошибка получения подписок:', error);
            return [];
        }
    }, [getUserId]);

    return { 
        subPlan, 
        setAddedSubs, 
        handleSubscription,
        manageSubscription,
        getSubscriptions,
        tg, 
        queryId, 
        user,
        isLoaded,
        getUserId,
        isInTelegram
    };
}