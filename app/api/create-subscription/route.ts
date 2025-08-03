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
            title: 'Подписка на сервис',
            description: `Месячная подписка • Автопродление каждые 30 дней • ${products.length} услуг`,
            payload: payload,
            currency: 'XTR',
            prices: [{
                label: 'Месячная подписка',
                amount: amount
            }],
            subscription_period: subscription_period || 2592000, 
        };

        const response = await fetch(`https://api.telegram.org/bot${token}/exportInvoice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceData)
        });

        const data = await response.json();
        
        if (!data.ok) {
            console.error('Ошибка Telegram API при создании подписки:', data);
            
            if (data.error_code === 400) {
                return NextResponse.json(
                    { error: 'Неверные параметры подписки', details: data.description }, 
                    { status: 400 }
                );
            } else if (data.error_code === 405) {
                return NextResponse.json(
                    { error: 'Метод не поддерживается для подписок', details: 'Используйте правильный API для создания подписок' }, 
                    { status: 405 }
                );
            }
            
            return NextResponse.json(
                { error: 'Ошибка создания подписки', details: data.description }, 
                { status: 500 }
            );
        }

        const invoiceUrl = `https://t.me/invoice/${data.result}`;

        return NextResponse.json({ 
            invoice_link: invoiceUrl,
            subscription_id: subscriptionId,
            amount: amount,
            period: subscription_period || 2592000,
            invoice_slug: data.result
        });

    } catch (error: any) {
        console.error('Ошибка сервера при создании подписки:', error);
        return NextResponse.json(
            { error: 'Ошибка сервера', details: error.message }, 
            { status: 500 }
        );
    }
}


