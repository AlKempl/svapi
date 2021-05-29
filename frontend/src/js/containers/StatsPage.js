import React from "react";
import axios from "axios";
import {Grid, Typography} from "@material-ui/core";
import {drawAgeChart, drawCitiesChart, drawCountryChart, drawGenderChart} from "../helpers/drawCharts";

export class StatsPage extends React.Component {
    componentDidMount() {
        axios
            .get("http://svapi:3000/api/people/getGenderStatistics")
            .then(response => drawGenderChart("gender-chart", response.data));

        axios
            .get("http://svapi:3000/api/people/getAgeStatistics")
            .then(response => drawAgeChart("age-chart", response.data));

        axios
            .get("http://svapi:3000/api/people/getCountriesStatistics")
            .then(response => drawCountryChart("country-chart", response.data));

        axios
            .get("http://svapi:3000/api/people/getCitiesStatistics")
            .then(response => drawCitiesChart("city-chart", response.data));
    }

    render() {
        return (
            <div className="charts-area">
                <Typography variant="h4" align="center">Статистика базы</Typography>
                <Grid container spacing={3}>
                    <Grid item xs={6}>
                        <Typography variant="h6" align="center">По полу</Typography>
                        <canvas id="gender-chart"></canvas>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="h6" align="center">По возрасту</Typography>
                        <canvas id="age-chart"></canvas>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="h6" align="center">По стране</Typography>
                        <canvas id="country-chart"></canvas>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="h6" align="center">По городу</Typography>
                        <canvas id="city-chart"></canvas>
                    </Grid>
                </Grid>
            </div>
        );
    }
}
