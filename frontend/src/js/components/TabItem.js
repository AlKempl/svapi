import React from "react";
import {Box, Typography} from "@material-ui/core";

export const TabItem = props => {
    const { children, value, index, ...other } = props;

    return (
        <Typography component="div" role="tabpanel" hidden={value !== index} {...other}>
            <Box p={3}>{children}</Box>
        </Typography>
    );
};
