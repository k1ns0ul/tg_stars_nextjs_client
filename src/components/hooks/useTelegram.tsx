import { useEffect } from "react";

const tg = (await import('@twa-dev/sdk')).default;

export function useTelegram() {
    
    const onClose = () => {
        tg.close();
    };

    const onToggleButton = () => {
        if (tg.MainButton.isVisible) {
            tg.MainButton.hide();
        } else {
            tg.MainButton.show();
        }
    };

    const openInvoice = (invoiceLink : any, callback : any) => {
        tg.openInvoice(invoiceLink, callback);
    };

    const showAlert = (message : any) => {
        tg.showAlert(message);
    };

    const showConfirm = (message : any, callback : any) => {
        tg.showConfirm(message, callback);
    };

    useEffect(() => {
        tg.ready();
    }, []);

    return {
        onClose,
        onToggleButton,
        openInvoice,
        showAlert,
        showConfirm,
        tg,
        user: tg.initDataUnsafe?.user,
        queryId: tg.initDataUnsafe?.query_id,
    };
}