import React from "react";
import {ExpansionPanel, ExpansionPanelSummary, ExpansionPanelDetails, TextField, Slider} from "@material-ui/core";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

export const Filters = props => {
    const { filter: { firstname = "", lastname = "", country = "", city = "", age = [5, 100] }, setFilter } = props;

    return (
        <div className="filter-area">
            <ExpansionPanel>
                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                    Фильтры
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                    <form>
                        <div className="filter-form">
                            <div>
                                <TextField
                                    label="Имя"
                                    value={firstname}
                                    onChange={e => setFilter({ firstname: e.target.value })}
                                /><br/>
                                <TextField
                                    value={lastname}
                                    label="Фамилия"
                                    onChange={e => setFilter({ lastname: e.target.value })}
                                /><br/>
                                <div className="age-filter">
                                    <div className="MuiFormLabel-root">Возраст</div>
                                    <div className="age-slider">
                                        <Slider
                                            value={age}
                                            onChange={(e, range) => setFilter({age: range})}
                                            min={5}
                                            max={100}
                                            valueLabelDisplay="on"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <TextField
                                    value={country}
                                    label="Страна"
                                    onChange={e => setFilter({ country: e.target.value })}
                                /><br/>
                                <TextField
                                    value={city}
                                    label="Город"
                                    onChange={e => setFilter({ city: e.target.value })}
                                />
                            </div>
                        </div>
                    </form>
                </ExpansionPanelDetails>
            </ExpansionPanel>
        </div>
    );
};
