import React from "react";
import {Alert} from "@material-ui/lab";
import {OTHER_ERROR, NetworkErrors}from "../constants/errors";

export const ErrorIndicator = props => {
    const { error } = props;

    let errorText;
    if (typeof error === "object") {
        const { response: { status } = {} } = error;
        errorText = status in NetworkErrors ? NetworkErrors[status] : OTHER_ERROR;
    }
    else errorText = error;

    return <div className="error-area"><Alert severity="error">{errorText}</Alert></div>;
};

export const NotFoundIndicator = () =>
    <div className="error-area"><Alert severity="warning">Похожих людей не найдено</Alert></div>;
