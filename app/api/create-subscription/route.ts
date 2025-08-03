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
            provider_token: '',
            currency: 'XTR', 
            prices: [{
                label: 'Месячная подписка',
                amount: amount
            }],
            start_parameter: 'subscription_start',
            subscription_period: subscription_period || 30 * 24 * 60 * 60, 
            recurring: true 
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
            console.error('Ошибка Telegram API при создании подписки:', data);
            return NextResponse.json(
                { error: 'Ошибка создания подписки', details: data.description }, 
                { status: 500 }
            );
        }

        return NextResponse.json({ 
            invoice_link: data.result,
            subscription_id: subscriptionId,
            amount: amount,
            period: subscription_period || 30 * 24 * 60 * 60
        });

    } catch (error: any) {
        console.error('Ошибка сервера при создании подписки:', error);
        return NextResponse.json(
            { error: 'Ошибка сервера', details: error.message }, 
            { status: 500 }
        );
    }
}


