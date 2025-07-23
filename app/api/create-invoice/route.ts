import TelegramBot from "node-telegram-bot-api";
import { NextRequest, NextResponse } from "next/server";
import { token } from "@/types/Constants";

export async function POST(request: NextRequest) {
    try {
        const { products, totalPrice, queryId, userId } = await request.json();

        if (!token){
            throw new Error('токен отсутствует')
        }
        const bot = new TelegramBot(token, { polling: false });

        bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            if (msg.successful_payment) {
                try {
                    const payload = msg.successful_payment.invoice_payload;

                    await bot.sendMessage(chatId, 
                        `Оплата прошла успешно!\n` +
                        `Заказ: ${payload}\n` +
                        `Сумма: ${msg.successful_payment.total_amount} ⭐\n` +
                        `ID транзакции: ${msg.successful_payment.telegram_payment_charge_id}`
                    );
                } catch (e: any) {
                    console.error('Ошибка при обработке платежа:', e);
                    await bot.sendMessage(chatId, 'Ошибка при обработке платежа');
                }
            }
        });

        const orderId = `order_${Date.now()}_${userId}`;
        const payload = orderId;

        const invoiceData = {
            title: 'Покупка товаров',
            description: `Количество товаров: ${products.length}`,
            payload: payload,
            provider_token: '',
            currency: 'XTR',
            prices: [{
                label: 'Итого',
                amount: totalPrice
            }],
            start_parameter: 'start_parameter'
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
            console.error('Ошибка Telegram API:', data);
            return NextResponse.json(
                { error: 'Ошибка создания инвойса', details: data.description }, 
                { status: 500 }
            );
        }

        return NextResponse.json({ invoice_link: data.result });

    } catch (error: any) {
        console.error('Ошибка сервера:', error);
        return NextResponse.json(
            { error: 'Ошибка сервера', details: error.message }, 
            { status: 500 }
        );
    }
}
