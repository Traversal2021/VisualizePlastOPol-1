const filePath = "../cells_database.csv";
const cellsPath = "../cells.csv";
const moment = require("moment");
const fs = require("fs");
const WEEKLY = "Weekly", MONTHLY = "Monthly", YEARLY = "Yearly";
const MIN_YEAR = 2013;
const periods = [YEARLY, MONTHLY, WEEKLY];
const csv = require('csv-parser');
const results = [];
const cellsData = [];

fs.createReadStream(cellsPath)
    .pipe(csv())
    .on('data', (data) => cellsData.push(data))
    .on('end', () => {
    });

fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
        let cells = JSON.parse(cellsData[0]["0"]);
        preComputeData(results, cells);
    });

const setupTimeline = (from, to, period) => {
    let start_date = moment(from.toString(), "YYYY");
    let end_date = moment(to.toString(), "YYYY").add(1, "y");
    let current_date = moment();
    if (current_date.year() === to) {
        if (period === WEEKLY) {
            current_date.add(1, "w").startOf("isoWeek");
        } else if (period === MONTHLY) {
            current_date.add(1, "M").startOf("M");
        } else {
            current_date.add(1, "y").startOf("y");
        }
        end_date = current_date;
    }
    return {start: start_date, end: end_date}
};

const log_normalized_radius = (enteredValue, minEntry, maxEntry, normalizedMin, normalizedMax) => {
    let mx = (Math.log((enteredValue - minEntry)) / (Math.log(maxEntry - minEntry)));
    const preshiftNormalized = mx * (normalizedMax - normalizedMin);
    return preshiftNormalized + normalizedMin;
};

const normalized_rgb = (old_val, max, min) => {
    return 255 - log_normalized_radius(old_val, min - 1, max, 0, 255);
};

const writeToFile = (features, fileName) => {
    const data = JSON.stringify(features);
    /* Async file write */
    fs.writeFile(fileName, data, (err) => {
        if (err) {
            throw err;
        }
        console.log("JSON data is saved.");
    });
    // fs.writeFileSync(fileName, data);
};

const getDate = instance => {
    return instance.format("YYYY-MM-DD HH:mm");
};

const getStartDate = (end, period) => {
    if (period === WEEKLY) {
        let year = moment(end).year();
        end.startOf("isoWeek");
        if (end.year() < year) {
            end.add(1, "y").startOf("y");
        }
    } else if (period === MONTHLY) {
        end.startOf("M");
    } else {
        end.startOf("y");
    }
    return getDate(end);
};

const getTruncatedFloat = value => value.toString().match(/^-?\d+(?:\.\d{0,4})?/)[0];

/* Replaced in python code */
const generateCells = (lat_min, lng_min, lat_max, lng_max, cell_rows, cell_columns) => {
    const half_cell_height = (lat_max - lat_min) / (2 * (cell_rows - 1));
    const half_cell_width = (lng_max - lng_min) / (2 * (cell_columns - 1));
    let lat_point = lat_min;
    let row_count = 0;
    let cells = [];
    while (row_count < cell_rows) {
        let lng_point = lng_min;
        let column_count = 0;
        while (column_count < cell_columns) {
            let lat_0 = lat_point - half_cell_height;
            let lng_0 = lng_point - half_cell_width;
            let lat_1 = lat_point + half_cell_height;
            let lng_1 = lng_point + half_cell_width;
            cells.push({latMin: lat_0, lngMin: lng_0, latMax: lat_1, lngMax: lng_1});
            lng_point += 2 * half_cell_width;
            column_count++;
        }
        lat_point += 2 * half_cell_height;
        row_count++;
    }
    return cells;
};

const createCellFeatures = (cells_collection, end_of_data_date, period, weight_max, weight_min) => {
    let features_collection = {
        type: "FeatureCollection",
        features: []
    };
    for (let k = 0; k < cells_collection.length; k++) {
        let cells = cells_collection[k];
        for (let cell of Object.values(cells)) {
            if (cell !== null) {
                let end = moment(cell.date);
                let endDate = getDate(end);
                if (end > end_of_data_date) { // Timeline upto last date of data collected
                    continue;
                }
                let startDate = getStartDate(end, period);
                let value = normalized_rgb(cell.weight, weight_max, weight_min);

                let bounds = cell.bounds;
                let latMin = bounds.lat_min;
                let lngMin = bounds.lng_min;
                let latMax = bounds.lat_max;
                let lngMax = bounds.lng_max;

                let dataString = `South West: ${getTruncatedFloat(latMin)}, ${getTruncatedFloat(lngMin)}<br>North East: ${getTruncatedFloat(latMax)}, ${getTruncatedFloat(lngMax)}<br>Weight: ${cell.weight} kg`;
                let feature = {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: [[
                            [lngMin, latMin],
                            [lngMin, latMax],
                            [lngMax, latMax],
                            [lngMax, latMin],
                            [lngMin, latMin]
                        ]]
                    }
                };
                feature.properties = {
                    start: startDate,
                    end: endDate,
                    color: "rgb(" + value + ", " + value + ", " + value + ")",
                    weight: 0,
                    fillOpacity: 0.85,
                    description: dataString
                };
                features_collection.features.push(feature);
            }
        }
    }
    return features_collection;
};

const getMaxMinWeights = data_cells => {
    let cells = Object.values(data_cells);
    let all_weights = [];
    for (let cell of cells) {
        all_weights.push(cell.weight);
    }
    return {max: Math.max(...all_weights), min: Math.min(...all_weights)};
};

const updateAllCells = (data_cells, pre_cells, cells, isNotFirst, end_date) => {
    for (let i = 0; i < cells.length; i++) {
        if (data_cells[i] === undefined) {
            let quantity = 0;
            let weight = 0;
            if (isNotFirst) {
                let pre_cell = pre_cells[i];
                if (pre_cell !== null && pre_cell !== undefined) {
                    quantity += pre_cell.quantity;
                    weight += pre_cell.weight;
                }
            }
            data_cells[i] = {
                bounds: cells[i],
                quantity: quantity,
                weight: weight,
                date: getDate(end_date)
            }
        }
    }
};

const createCells = (results, cells, from, to, period) => {
    console.log(from, to, period);
    let weight_max = null;
    let weight_min = null;
    let cells_collection = [];
    let pre_cells = [];
    let pre_cell = null;
    let timestamp = 0;
    let isNotFirst = false;

    let end_of_data_date = moment();
    let timelineData = setupTimeline(from, to, period);
    let start_date = timelineData.start;

    let end_date = moment(start_date);
    while (start_date < timelineData.end) {
        if (period === WEEKLY) {
            end_date.endOf("isoWeek");
            if (end_date.year() > to) {
                end_date.subtract(1, "y").endOf("y");
            }
        } else if (period === MONTHLY) {
            end_date.endOf("M");
        } else {
            end_date.endOf("y");
        }

        if (isNotFirst) {
            pre_cells = cells_collection[timestamp - 1];
        }
        let data_cells = {};

        for (let i = 1; i < results.length; ++i) {
            let date = moment(results[i].date);
            if (date > start_date && date <= end_date) {
                let quantity = 0;
                let weight = 0;
                let boundsId = parseInt(results[i].boundsId);
                let quantity_data = results[i].quantity;
                let weight_data = results[i].weight;
                if (quantity_data.trim() !== "") {
                    quantity += parseInt(quantity_data);
                }
                if (weight_data.trim() !== "") {
                    weight += parseFloat(weight_data);
                }
                let data_cell = data_cells[boundsId];
                if (data_cell === undefined) {
                    if (isNotFirst) {
                        pre_cell = pre_cells[boundsId];
                        if (pre_cell !== null && pre_cell !== undefined) {
                            quantity += pre_cell.quantity;
                            weight += pre_cell.weight;
                        }
                    }
                    data_cell = {
                        bounds: cells[boundsId],
                        quantity: quantity,
                        weight: weight,
                        date: getDate(end_date)
                    };
                    data_cells[boundsId] = data_cell;
                } else {
                    data_cell.weight += weight;
                    data_cell.quantity += quantity;
                }
                end_of_data_date = getDate(end_date); /*Added to include 0 value cells*/
            }
        }
        updateAllCells(data_cells, pre_cells, cells, isNotFirst, end_date);
        let max_min_weights = getMaxMinWeights(data_cells);
        let maxWeight = max_min_weights.max;
        let minWeight = max_min_weights.min;

        if (weight_max === null || maxWeight > weight_max) {
            weight_max = maxWeight;
        }
        if (weight_min === null || minWeight < weight_min) {
            weight_min = minWeight;
        }
        cells_collection.push(data_cells);
        timestamp++;
        isNotFirst = true;

        if (period === WEEKLY) {
            start_date = moment(end_date).add(1, "s");
            end_date = moment(start_date);

        } else if (period === MONTHLY) {
            end_date.add(1, "M");
            start_date.add(1, "M");
        } else {
            end_date.add(1, "y");
            start_date.add(1, "y");
        }
    }
    let features_collection = createCellFeatures(cells_collection, end_of_data_date, period, weight_max, weight_min);

    let dir_path = "plast_data/";
    fs.mkdir(dir_path, {recursive: true}, (err) => {
        if (err) throw err;
    });
    writeToFile(features_collection, dir_path + "cells_" + from + "_" + to + "_" + period + ".json");
};

const preComputeData = (results, cells) => {
    for (let period of periods) {
        let max_year = moment().year();
        for (let i = max_year; i >= MIN_YEAR; i--) {
            for (let j = i; j >= MIN_YEAR; j--) {
                createCells(results, cells, j, i, period);
            }
        }
    }
};
