import React from "react";
import Button from "../Button/Button";

interface Subscription {
    id: number | string;
    title: string;
    description: string;
    price: number;
}

interface SubItemProps {
    subs: Subscription;
    className: string;
    onAddSub: (product: Subscription) => void;
}

const SubsItem: React.FC<SubItemProps> = ({subs, className, onAddSub}) => {
    const onAddHandler = () => {
        onAddSub(subs);
    }

    return (
        <div className={'subs' + className}>
            <div className={'img'}/>
            <div className={'title'}>{subs.title}</div>
            <div className={'description'}>{subs.description}</div>
            <div className={'price'}>
                <span>стоимость: <b>{subs.price}</b></span>
            </div>
            <Button className={'add-btn'} onClick={onAddHandler}> 
                Добавить в корзину
            </Button>
        </div>
    )
}

export default SubsItem;