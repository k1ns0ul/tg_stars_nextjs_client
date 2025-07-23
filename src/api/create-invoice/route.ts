import TelegramBot from "node-telegram-bot-api";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request : NextRequest) {
    try{
        const {products, totalPrice, queryId, userId} = await request.json();

        const token = '8101783883:AAFK39sE4PPqyfhhyBUcsqQWPFZCOXxhQjA';

        const bot = new TelegramBot(token, {polling : true});

        bot.on('messaage', async(msg) => {
            const chatId = msg.chat.id;
            if (msg.successful_payment) {
                try{
                    const payload = msg.successful_payment.invoice_payload;

                    await bot.sendMessage(chatId, 
                        `оплата прошла успешно!\n` +
                        `заказ: ${payload}\n` +
                        `сумма: ${msg.successful_payment.total_amount} ⭐\n` +
                        `ID транзакции: ${msg.successful_payment.telegram_payment_charge_id}`
                    );
                } catch(e : any) {
                    await bot.sendMessage(chatId, 'ошибка при обработке платежа', e)
                }
            }
        })

        const orderId = `order_${Date.now()}_${userId}`;
        const payload = orderId;

        const invoiceData = {
            title: 'покупка товаров',
            description: `кол-во товаров: ${products.length}`,
            payload: payload,
            provider_token: '',
            currency: 'XTR',
            prices: [{
                label: 'итого',
                amount: totalPrice
            }],
            start_parameter: 'start_parameter'
        }

        const response = await fetch(`https://api.telegram.org/bot${token}/createInvoiceLink`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invoiceData)
        });

        const data = await response.json()
        if (!data.ok) {
            return NextResponse.json({error: 'ошибка создания инвойса'}, {status: 500})
        }
        return NextResponse.json({invoiceLink: data.result})
    } catch {
        return NextResponse.json({error : 'ошибка сервера'}, {status : 500})
    }
}