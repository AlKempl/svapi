import React, {useState} from "react";
import {Menu} from "./components/Menu";
import {AppBar, Typography} from "@material-ui/core";
import {TabItem} from "./components/TabItem";
import {SearchPage} from "./containers/SearchPage";
import {HistoryPage} from "./containers/HistoryPage";
import {StatsPage} from "./containers/StatsPage";

export const App = () => {
    const [ currentPage, setCurrentPage ] = useState(0);
    return (
        <div>
            <Typography variant="h3" align="center" id="serviceTitle">SVAPI</Typography>
            <AppBar position="static" color="default">
                <Menu currentPage={currentPage} setCurrentPage={setCurrentPage}/>
            </AppBar>

            <TabItem index={0} value={currentPage}><SearchPage /></TabItem>
            <TabItem index={1} value={currentPage}><HistoryPage /></TabItem>
            <TabItem index={2} value={currentPage}><StatsPage /></TabItem>
        </div>
    );
};
