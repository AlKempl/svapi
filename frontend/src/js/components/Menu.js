import React from "react";
import {Tab, Tabs} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import HistoryIcon from "@material-ui/icons/History";
import EqualizerIcon from "@material-ui/icons/Equalizer";

export const Menu = props => {
    const { currentPage, setCurrentPage } = props;
    const onChange = (e, page) => setCurrentPage(page);
    return (
        <Tabs value={currentPage} indicatorColor="primary" textColor="primary" onChange={onChange} centered>
            <Tab label="Поиск" icon={<SearchIcon />} />
            <Tab label="История" icon={<HistoryIcon />} />
            <Tab label="Статистика" icon={<EqualizerIcon />} />
        </Tabs>
    );
};
