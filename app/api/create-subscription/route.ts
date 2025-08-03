import TelegramBot from "node-telegram-bot-api";
import { NextRequest, NextResponse } from "next/server";
import { token } from "@/types/Constants";

export async function POST(request: NextRequest) {
    try {
        const { products, queryId, userId, subscription_period, amount } = await request.json();

        if (!token) {
            throw new Error('токен отсутствует');
        }

        const bot = new TelegramBot(token, { polling: false });

        bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            
            if (msg.successful_payment) {
                try {
                    const payload = msg.successful_payment.invoice_payload;
                    const isSubscription = payload.startsWith('subscription_');

                    if (isSubscription) {
                        await bot.sendMessage(chatId, 
                            `Подписка успешно оформлена!\n\n` +
                            `Заказ: ${payload}\n` +
                            `Стоимость: ${msg.successful_payment.total_amount} ⭐\n` +
                            `Период: 30 дней\n` +
                            `ID транзакции: ${msg.successful_payment.telegram_payment_charge_id}\n\n`
                        );
                    }
                } catch (e: any) {
                    console.error('Ошибка при обработке платежа подписки:', e);
                    await bot.sendMessage(chatId, 'Ошибка при обработке платежа подписки');
                }
            }
        });

        const subscriptionId = `subscription_${Date.now()}_${userId}`;
        const payload = subscriptionId;

        const invoiceData = {
            title: 'Подписка',
            description: `Месячная подписка`,
            payload: payload,
            provider_token: '', 
            recurring: true,
            currency: 'XTR', 
            prices: [{
                label: 'Месячная подписка',
                amount: amount
            }],
            start_parameter: 'subscription_start',
            subscription_period: 2592000
        };

        const response = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceData)
        });

        const data = await response.json();
        
        if (!data.ok) {
            console.error('Ошибка Telegram Bot API при создании подписки:', data);
            console.error('Отправленные данные:', invoiceData);
            
            let errorMessage = data.description || 'Неизвестная ошибка';
            
            if (data.error_code === 400) {
                if (data.description?.includes('CURRENCY_NOT_SUPPORTED')) {
                    errorMessage = 'Валюта XTR (Telegram Stars) не поддерживается в вашем регионе';
                } else if (data.description?.includes('AMOUNT_TOO_HIGH')) {
                    errorMessage = 'Сумма подписки превышает максимально допустимую';
                } else if (data.description?.includes('SUBSCRIPTION_PERIOD_INVALID')) {
                    errorMessage = 'Неверный период подписки. Разрешены только 30 дней';
                }
            }
            
            return NextResponse.json(
                { error: 'Ошибка создания подписки', details: errorMessage }, 
                { status: data.error_code || 500 }
            );
        }

        return NextResponse.json({ 
            invoice_link: data.result,
            subscription_id: subscriptionId,
            amount: amount,
            period: subscription_period || 2592000
        });

    } catch (error: any) {
        console.error('Ошибка сервера при создании подписки:', error);
        return NextResponse.json(
            { error: 'Ошибка сервера', details: error.message }, 
            { status: 500 }
        );
    }
}