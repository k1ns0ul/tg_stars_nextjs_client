import TelegramBot from "node-telegram-bot-api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const update = await request.json();
        const token = process.env.TELEGRAM_BOT_TOKEN 
        if(!token){
            throw new Error('токен отсутствует')
        }
        const bot = new TelegramBot(token, { polling: false });

        if (update.message && update.message.successful_payment) {
            const payment = update.message.successful_payment;
            const chatId = update.message.chat.id;
            
            try {
                const orderId = payment.invoice_payload;
                
                await bot.sendMessage(chatId, 
                    `оплата прошла успешно!\n\n` +
                    `заказ: ${orderId}\n` +
                    `сумма: ${payment.total_amount} ⭐\n` +
                    `id транзакции: ${payment.telegram_payment_charge_id}\n\n`
                );

                console.log('Успешный платеж:', {
                    orderId,
                    amount: payment.total_amount,
                    transactionId: payment.telegram_payment_charge_id,
                    userId: update.message.from.id
                });

            } catch (error) {
                console.error('Ошибка при обработке платежа:', error);
                await bot.sendMessage(chatId, 'Произошла ошибка при обработке платежа. Обратитесь в поддержку.');
            }
        }

        if (update.pre_checkout_query) {
            const preCheckoutQuery = update.pre_checkout_query;
            
            try {
                await fetch(`https://api.telegram.org/bot${token}/answerPreCheckoutQuery`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pre_checkout_query_id: preCheckoutQuery.id,
                        ok: true
                    })
                });
                
                console.log('Pre-checkout подтвержден:', preCheckoutQuery.id);
                
            } catch (error) {
                console.error('Ошибка pre-checkout:', error);
                
                await fetch(`https://api.telegram.org/bot${token}/answerPreCheckoutQuery`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pre_checkout_query_id: preCheckoutQuery.id,
                        ok: false,
                        error_message: 'Произошла ошибка при обработке платежа'
                    })
                });
            }
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Ошибка webhook:', error);
        return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
    }
}