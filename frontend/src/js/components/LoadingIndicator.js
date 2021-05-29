import React from "react";
import {CircularProgress} from "@material-ui/core";

export const LoadingIndicator = props => {
    const { text } = props;

    return (
        <div className="loading-area">
            <CircularProgress/>
            <div className="loading-text">{text}</div>
        </div>
    );
};
