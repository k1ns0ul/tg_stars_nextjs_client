import React, { useCallback, useEffect, useState } from "react";
import './Form.css'
import { useTelegram } from "../hooks/useTelegram";

const Form = () => {
    const [usrID, setUsrID] = useState('')
    const [orderID, setOrderID] = useState('')
    const {tg} = useTelegram();

    const onSendData = useCallback(() => {
        const data = {
            usrID,
            orderID
        }
        tg.sendData(JSON.stringify(data));
    }, [usrID, orderID])
    
    useEffect(() => {
        tg.onEvent('mainButtonClicked', onSendData)
        return () => {
            tg.offEvent('mainButtonClicked', onSendData)
        }
    }, [onSendData])

    useEffect( () => {
        tg.MainButton.setParams({
            text: 'отправить данные'
        })
    }, [])

    useEffect(() => {
        if(!usrID || !orderID) {
            tg.MainButton.hide();
        } else {
            tg.MainButton.show();
        }
    }, [usrID, orderID])

    const onChangeUsrID = (e : any) => {
        setUsrID(e.target.value)
    }

    const onChangeOrderID = (e : any) => {
        setOrderID(e.target.value)
    }

    return(
        <div className={"form"}>
            <h3>
                Введите ваши данные
            </h3>
            <input className={'input'} type = "text" placeholder={'Username'} value={usrID} onChange={onChangeUsrID}/>
            <input className={'input'} type = "text" placeholder={'Номер заказа'} value={orderID} onChange={onChangeOrderID}/>
        </div>
    )
}

export default Form;