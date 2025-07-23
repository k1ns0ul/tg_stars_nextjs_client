Bot link: https://t.me/mrkt_tst1_bot

curl -X POST "https://api.telegram.org/bot<8101783883:AAFK39sE4PPqyfhhyBUcsqQWPFZCOXxhQjA>/setWebhook" \
-H "Content-Type: application/json" \
-d '{
  "url": "https://tg-stars-nextjs-client.vercel.app/api/webhook",
  "allowed_updates": ["message", "pre_checkout_query"]
}'