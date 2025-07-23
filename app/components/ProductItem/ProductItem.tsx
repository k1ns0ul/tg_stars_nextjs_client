import React from "react";
import Button from "../Button/Button";

interface Product {
    id: number | string;
    title: string;
    description: string;
    price: number;
}

interface ProductItemProps {
    product: Product;
    className: string;
    onAdd: (product: Product) => void;
}

const ProductItem: React.FC<ProductItemProps> = ({product, className, onAdd}) => {
    const onAddHandler = () => {
        onAdd(product);
    }

    return (
        <div className={'product' + className}>
            <div className={'img'}/>
            <div className={'title'}>{product.title}</div>
            <div className={'description'}>{product.description}</div>
            <div className={'price'}>
                <span>стоимость: <b>{product.price}</b></span>
            </div>
            <Button className={'add-btn'} onClick={onAddHandler}> 
                Добавить в корзину
            </Button>
        </div>
    )
}

export default ProductItem;