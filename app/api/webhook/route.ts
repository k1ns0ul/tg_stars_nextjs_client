import { NextRequest, NextResponse } from "next/server";
import { token } from "@/types/Constants";

export async function POST(request: NextRequest) {
    try {
        const update = await request.json();
        console.log('Webhook получен:', JSON.stringify(update, null, 2));

        if (update.pre_checkout_query) {
            const preCheckoutQuery = update.pre_checkout_query;
            
            try {
                const response = await fetch(`https://api.telegram.org/bot${token}/answerPreCheckoutQuery`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        pre_checkout_query_id: preCheckoutQuery.id,
                        ok: true
                    })
                });

                const result = await response.json();
                console.log('Pre-checkout ответ:', result);
                
                return NextResponse.json({ ok: true });
                
            } catch (error) {
                console.error('Ошибка pre-checkout:', error);
                
                try {
                    await fetch(`https://api.telegram.org/bot${token}/answerPreCheckoutQuery`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            pre_checkout_query_id: preCheckoutQuery.id,
                            ok: false,
                            error_message: 'Произошла техническая ошибка'
                        })
                    });
                } catch (fallbackError) {
                    console.error('Ошибка fallback ответа:', fallbackError);
                }
                
                return NextResponse.json({ ok: true });
            }
        }

        if (update.message && update.message.successful_payment) {
            processSuccessfulPayment(update.message);
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Ошибка webhook:', error);
        return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
    }
}

async function processSuccessfulPayment(message : any) {
    const payment = message.successful_payment;
    const chatId = message.chat.id;
        
    try {
        const orderId = payment.invoice_payload;
        
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: `Оплата прошла успешно!\n\n` +
                      `Заказ: ${orderId}\n` +
                      `Сумма: ${payment.total_amount} ⭐\n` +
                      `ID транзакции: ${payment.telegram_payment_charge_id}\n\n` +
                      `Спасибо за покупку!`
            })
        });

        console.log('Платеж обработан успешно:', {
            orderId,
            amount: payment.total_amount,
            transactionId: payment.telegram_payment_charge_id,
            userId: message.from.id
        });

    } catch (error) {
        console.error('Ошибка при обработке успешного платежа:', error);
    }
}

export async function GET() {
    return NextResponse.json({ 
        message: 'вебхук работает',
        timestamp: new Date().toISOString()
    });
}