import React from "react";

const Button = (props : any) => {
    return(
        <button {...props} className={'button' + props.className}/>
    );
};

export default Button;