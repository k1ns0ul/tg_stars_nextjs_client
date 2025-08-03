import TelegramBot from "node-telegram-bot-api";
import { NextRequest, NextResponse } from "next/server";
import { token } from "@/types/Constants";

interface CreateInvoiceRequest {
    queryId?: string;
    userId: string;
    
    products?: any[];
    totalPrice?: number;

    subscription_period?: number;
    amount?: number;
    isSubscription?: boolean;
}

interface InvoiceData {
    title: string;
    description: string;
    payload: string;
    provider_token: string;
    currency: string;
    prices: Array<{
        label: string;
        amount: number;
    }>;
    start_parameter: string;
    recurring?: boolean;
    subscription_period?: number;
}

export async function POST(request: NextRequest) {
    try {
        const requestData: CreateInvoiceRequest = await request.json();
        const { products, totalPrice, queryId, userId, subscription_period, amount, isSubscription } = requestData;

        if (!token) {
            throw new Error('токен отсутствует');
        }

        const bot = new TelegramBot(token, { polling: false });

        bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            
            if (msg.successful_payment) {
                try {
                    const payload = msg.successful_payment.invoice_payload;
                    const isSubscriptionPayment = payload.startsWith('subscription_');

                    if (isSubscriptionPayment) {
                        await bot.sendMessage(chatId, 
                            `Подписка успешно оформлена!\n\n` +
                            `Заказ: ${payload}\n` +
                            `Стоимость: ${msg.successful_payment.total_amount} ⭐\n` +
                            `Период: 30 дней\n` +
                            `ID транзакции: ${msg.successful_payment.telegram_payment_charge_id}\n\n` 
                        );
                    } else {
                        await bot.sendMessage(chatId, 
                            `Оплата прошла успешно!\n\n` +
                            `Заказ: ${payload}\n` +
                            `Сумма: ${msg.successful_payment.total_amount} ⭐\n` +
                            `ID транзакции: ${msg.successful_payment.telegram_payment_charge_id}\n\n`
                        );
                    }
                } catch (e: any) {
                    console.error('Ошибка при обработке платежа:', e);
                    await bot.sendMessage(chatId, 'Ошибка при обработке платежа. Обратитесь в поддержку.');
                }
            }
        });

        let invoiceData: InvoiceData;
        let orderId: string;

        if (isSubscription) {
            if (!amount) {
                return NextResponse.json(
                    { error: 'Для подписки требуется указать amount' }, 
                    { status: 400 }
                );
            }

            orderId = `subscription_${Date.now()}_${userId}`;
            
            invoiceData = {
                title: 'Премиум подписка',
                description: 'Месячная подписка с эксклюзивными возможностями',
                payload: orderId,
                provider_token: '', 
                recurring: true,
                currency: 'XTR', 
                prices: [{
                    label: 'Месячная подписка',
                    amount: amount
                }],
                start_parameter: 'start_parameter',
                subscription_period: 2592000 
            };
        } else {
            if (!products || !totalPrice) {
                return NextResponse.json(
                    { error: 'Для покупки требуются products и totalPrice' }, 
                    { status: 400 }
                );
            }

            orderId = `order_${Date.now()}_${userId}`;
            
            invoiceData = {
                title: '🛒 Покупка товаров',
                description: `Количество товаров: ${products.length}`,
                payload: orderId,
                provider_token: '',
                currency: 'XTR',
                prices: [{
                    label: 'Итого',
                    amount: totalPrice
                }],
                start_parameter: 'start_parameter'
            };
        }

        const response = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceData)
        });

        const data = await response.json();
        
        if (!data.ok) {
            console.error('Ошибка Telegram API:', data);
            console.error('Отправленные данные:', invoiceData);
            
            let errorMessage = data.description || 'Неизвестная ошибка';
            
            if (data.error_code === 400) {
                if (data.description?.includes('CURRENCY_NOT_SUPPORTED')) {
                    errorMessage = 'Валюта XTR (Telegram Stars) не поддерживается в вашем регионе';
                } else if (data.description?.includes('AMOUNT_TOO_HIGH')) {
                    errorMessage = 'Сумма превышает максимально допустимую';
                } else if (data.description?.includes('SUBSCRIPTION_PERIOD_INVALID')) {
                    errorMessage = 'Неверный период подписки. Разрешены только 30 дней (2592000 секунд)';
                } else if (data.description?.includes('RECURRING_NOT_SUPPORTED')) {
                    errorMessage = 'Подписки не поддерживаются. Используйте обычные платежи';
                }
            }
            
            return NextResponse.json(
                { 
                    error: isSubscription ? 'Ошибка создания подписки' : 'Ошибка создания инвойса', 
                    details: errorMessage 
                }, 
                { status: data.error_code || 500 }
            );
        }

        const responseData: any = {
            invoice_link: data.result,
            order_id: orderId,
            type: isSubscription ? 'subscription' : 'purchase'
        };

        if (isSubscription) {
            responseData.amount = amount;
            responseData.period_seconds = subscription_period || 2592000;
            responseData.period_days = Math.floor((subscription_period || 2592000) / 86400);
        } else {
            responseData.total_price = totalPrice;
            responseData.products_count = products?.length || 0;
        }

        return NextResponse.json(responseData);

    } catch (error: any) {
        console.error('Ошибка сервера:', error);
        return NextResponse.json(
            { error: 'Ошибка сервера', details: error.message }, 
            { status: 500 }
        );
    }
}
