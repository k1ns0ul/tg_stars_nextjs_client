import React, { useCallback, useEffect } from "react";
import './ProductList.css'
import ProductItem from "../ProductItem/ProductItem";
import { useTelegram } from "@/components/hooks/useTelegram";
import { useState } from "react";
import { handleStarsPayment } from "@/features/payment/Payment";
import { serverLink } from "@/types/Constants";

const products = [
    {id: '1', title: 'item1', price: 1, description: 'description1'},
    {id: '2', title: 'item2', price: 1, description: 'description2'},
    {id: '3', title: 'item3', price: 1, description: 'description3'},
]

export const getTotalPrice = (items : any) => {
    return items.reduce((acc : any, item : any) => {
        return acc += item.price
    }, 0)
}

const ProductList = () => {
    const [addedItems, setAddedItems] = useState<any[]>([])
    const {tg, queryId, user} = useTelegram();
    
    const onSendData = useCallback(() => {
        const data = {
            products: addedItems,
            totalPrice: getTotalPrice(addedItems),
            queryId,
        }

        fetch(serverLink + '/web-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',                
            },
            body: JSON.stringify(data)
        })
    }, [addedItems, queryId])

    const onAdd = (product : any) => {
        const alreadyAdded = addedItems.find(item => item.id === product.id);
        let newItems = [];

        if(alreadyAdded) {
            newItems = addedItems.filter(item => item.id !== product.id)
        } else {
            newItems = [...addedItems, product]
        }

        setAddedItems(newItems);

        if(newItems.length === 0) {
            tg.MainButton.hide();
        } else {
            tg.MainButton.show();
            tg.MainButton.setParams({
                text: `Купить за ${getTotalPrice(newItems)} ⭐`
            });
        }
    }

    useEffect(() => {
        if (addedItems.length > 0) {
            tg.MainButton.onClick(handleStarsPayment);
        }
        
        return () => {
            tg.MainButton.offClick(handleStarsPayment);
        };
    }, [handleStarsPayment, addedItems.length, tg]);

    return (
        <div className={'list'}>
            {products.map(item => (
                <ProductItem
                    key={item.id}
                    product={item}
                    onAdd={onAdd}
                    className={'item'}
                />
            ))}
        </div>
    )
}

export default ProductList;