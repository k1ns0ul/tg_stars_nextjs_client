import React, { useCallback, useEffect } from "react";
import ProductItem from "../ProductItem/ProductItem";
import { useTelegram } from "../hooks/useTelegram";
import { useState } from "react";
import { usePayment } from "../../features/payment/Payment";
import { useSubscription } from "@/features/subscription/Subscription";

const products = [
    {id: '1', title: 'item1', price: 1, description: 'description1'},
    {id: '2', title: 'item2', price: 1, description: 'description2'},
    {id: '3', title: 'item3', price: 15, description: 'description3'},
]

const subs = [
    {id: '1', title: 'sub1', price: 1, description: 'description1'}
]

export const getTotalPrice = (items: any) => {
    return items.reduce((acc: any, item: any) => {
        return acc += item.price
    }, 0)
}

export const getTotalSubPrice = (items: any) => {
    return items.reduce((acc: any, item: any) => {
        return acc += item.price
    }, 0)
}

const ProductList = () => {
    const { addedItems, setAddedItems, handleStarsPayment } = usePayment();
    const { tg, queryId, user } = useTelegram();
    const { subPlan, setAddedSubs , handleSubscription} = useSubscription();
    
    const [purchaseType, setPurchaseType] = useState<'products' | 'subscription' | null>(null);
    const [selectedSubscription, setSelectedSubscription] = useState<any>(null);

    const onAdd = (product: any) => {
        const addedItemsTyped = addedItems as any[];
        const alreadyAdded = addedItemsTyped.find(item => item.id === product.id);
        let newItems = [];

        if (alreadyAdded) {
            newItems = addedItems.filter(item => item.id !== product.id)
        } else {
            newItems = [...addedItems, product]
        }

        setAddedItems(newItems);
        setPurchaseType('products');
        setSelectedSubscription(null);
        updateMainButton(newItems, null, 'products');
    }

    const onAddSub = (sub: any) => {
        if (selectedSubscription && selectedSubscription.id === sub.id) {
            setSelectedSubscription(null);
            setPurchaseType(null);
            setAddedItems([]);
            updateMainButton([], null, null);
        } else {
            setSelectedSubscription(sub);
            setPurchaseType('subscription');
            setAddedItems([]);
            updateMainButton([], sub, 'subscription');
        }
    }

    const updateMainButton = (items: any[], subscription: any, type: 'products' | 'subscription' | null) => {
        if (type === 'subscription' && subscription) {
            tg.MainButton.show();
            tg.MainButton.setParams({
                text: `Купить подписку за ${subscription.price} ⭐`
            });
        } else if (type === 'products' && items.length > 0) {
            tg.MainButton.show();
            tg.MainButton.setParams({
                text: `Купить за ${getTotalPrice(items)} ⭐`
            });
        } else {
            tg.MainButton.hide();
        }
    }

    const handlePayment = useCallback(() => {
        if (purchaseType === 'subscription' && selectedSubscription) {
            console.log('Покупка подписки:', selectedSubscription);
            handleSubscription();
        } else if (purchaseType === 'products' && addedItems.length > 0) {
            console.log('Покупка товаров:', addedItems);
            handleStarsPayment();
        }
    }, [purchaseType, selectedSubscription, addedItems, handleStarsPayment]);

    useEffect(() => {
        if ((addedItems.length > 0 || selectedSubscription) && tg && tg.MainButton) {
            tg.MainButton.onClick(handlePayment);
        }

        return () => {
            try {
                if (tg && tg.MainButton && typeof tg.MainButton.offClick === 'function') {
                    tg.MainButton.offClick(handlePayment);
                }
            } catch (error) {
                console.warn('Error removing MainButton click handler:', error);
            }
        };
    }, [handlePayment, addedItems.length, selectedSubscription, tg]);

    return (
        <div className={'list'}>
            <div className={'subscription-section'}>
                <h3>Подписки</h3>
                {subs.map(sub => (
                    <ProductItem
                        key={`sub-${sub.id}`}
                        product={sub}
                        onAdd={onAddSub}
                        className={`item ${selectedSubscription?.id === sub.id ? 'selected' : ''}`}
                    />
                ))}
            </div>

            <div className={'products-section'}>
                <h3>Товары</h3>
                {products.map(item => (
                    <ProductItem
                        key={item.id}
                        product={item}
                        onAdd={onAdd}
                        className={'item'}
                    />
                ))}
            </div>

            {purchaseType && (
                <div className={'purchase-info'}>
                    {purchaseType === 'subscription' 
                        ? `Выбрана подписка: ${selectedSubscription?.title}` 
                        : `Выбрано товаров: ${addedItems.length}`
                    }
                </div>
            )}
        </div>
    )
}

export default ProductList;