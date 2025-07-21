import React from "react";
import './Button.css'

const Button = (props : any) => {
    return(
        <button {...props} className={'button' + props.className}/>
    );
};

export default Button;