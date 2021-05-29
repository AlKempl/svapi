import "../../../libs/chart"; //include Chart.JS

const drawChart = (canvasId, values, labels) => {
    const ctx = document.getElementById(canvasId).getContext("2d");
    new Chart(ctx, {
        type: "pie",
        data: {
            datasets: [{
                data: values,
                backgroundColor: [
                    "rgb(255,99,132)",
                    "rgb(255,159,64)",
                    "rgb(255,205,86)",
                    "rgb(75,192,192)",
                    "rgb(54,162,235)"
                ]
            }],
            labels
        }
    });
};

export const drawGenderChart = (canvasId, data) => {
    const { result: dataArray } = data;
    const values = dataArray.map(el => el[Object.keys(el)[0]]);
    const labels = dataArray.map(el => Object.keys(el)[0]).map(gender => {
        switch (gender) {
            case "male":
                return "мужской";
            case "2":
                return "женский";
            default:
                return "не указан";
        }
    });

    drawChart(canvasId, values, labels);
};

export const drawAgeChart = (canvasId, data) => {
    const { result: dataArray } = data;
    const values = Object.keys(dataArray).map(key => dataArray[key]);
    const labels = Object.keys(dataArray);

    drawChart(canvasId, values, labels);
};

export const drawCountryChart = (canvasId, data) => {
    const { result: dataArray } = data;
    const values = dataArray.map(el => el[Object.keys(el)[0]]);
    const labels = dataArray.map(el => Object.keys(el)[0]).map(country => country === "" ? "не указана" : country);

    drawChart(canvasId, values, labels);
};

export const drawCitiesChart = (canvasId, data) => {
    const { result: dataArray } = data;
    const values = dataArray.map(el => el[Object.keys(el)[0]]);
    const labels = dataArray.map(el => Object.keys(el)[0]).map(city => city === "" ? "не указан" : city);

    drawChart(canvasId, values, labels);
};
