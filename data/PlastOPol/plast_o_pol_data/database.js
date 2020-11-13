const filePath = "../database.csv";
const moment = require("moment");
const Papa = require("papaparse");
const fs = require("fs");
const data = fs.readFileSync(filePath, "utf8");
const WEEKLY = "Weekly", MONTHLY = "Monthly", YEARLY = "Yearly";
const MIN_YEAR = 2013;
const periods = [YEARLY, MONTHLY, WEEKLY];
/*const lat_min = 62.457542118073206, lat_max = 62.50245788192679, lng_min = 6.221395989884522,
    lng_max = 6.318604010115477; //Svinøya 5x5 */
const lat_min = 62.345252708439276, lat_max = 62.61474729156072, lng_min = 5.978375939307136,
    lng_max = 6.561624060692863; //Svinøya 30x30
const cell_rows = 16, cell_columns = 16;

const getStepRange = (start_date, period) => {
    let current_date = moment();
    if (current_date.year() === start_date.year()) {
        if (period === WEEKLY) {
            return {min: 1, max: current_date.isoWeek()};
        } else if (period === MONTHLY) {
            return {min: 0, max: current_date.month()};
        } else {
            return {min: 1, max: 1};
        }
    } else {
        if (period === WEEKLY) {
            return {min: 1, max: start_date.isoWeeksInYear()};
        } else if (period === MONTHLY) {
            return {min: 0, max: 11};
        } else {
            return {min: 1, max: 1};
        }
    }
};

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
    // fs.writeFile(fileName, data, (err) => {
    //     if (err) {
    //         throw err;
    //     }
    //     console.log("JSON data is saved.");
    // });
    fs.writeFileSync(fileName, data);
};

const getDate = instance => {
    return instance.format("YYYY-MM-DD HH:mm");
};

const getStartDate = (end, period) => {
    if (period === WEEKLY) {
        end.startOf("isoWeek");
    } else if (period === MONTHLY) {
        end.startOf("M");
    } else {
        end.startOf("y");
    }
    return getDate(end);
};

const generateCells = (lat_min, lng_min, lat_max, lng_max, cell_rows, cell_columns) => {
    const half_cell_height = (lat_max - lat_min) / (2 * (cell_rows - 1));
    const half_cell_width = (lng_max - lng_min) / (2 * (cell_columns - 1));
    let lat_point = lat_min;
    let row_count = 0;
    let cells = [];
    while (row_count < cell_rows) {
        let lng_point = lng_min;
        let column_count = 0;
        let inner_cells = [];
        while (column_count < cell_columns) {
            let lat_0 = lat_point - half_cell_height;
            let lng_0 = lng_point - half_cell_width;
            let lat_1 = lat_point + half_cell_height;
            let lng_1 = lng_point + half_cell_width;
            let bounds = [[lat_0, lng_0], [lat_1, lng_1]];
            inner_cells[column_count] = {bounds: bounds};
            lng_point += 2 * half_cell_width;
            column_count++;
        }
        cells[row_count] = inner_cells;
        lat_point += 2 * half_cell_height;
        row_count++;
    }
    return cells;
};

const createCells = (results, cells, from, to, period) => {
    console.log(from, to, period);
    let allData = results.data;

    let quantity_max = null;
    let quantity_min = null;
    let weight_max = null;
    let weight_min = null;
    let cells_collection = [];
    let pre_cells = [];
    let pre_inner_cells = [];
    let pre_inner_cell = null;
    let timestamp = 0;

    let end_of_data_date = moment();
    let timelineData = setupTimeline(from, to, period);
    let start_date = timelineData.start;

    let min_max = getStepRange(start_date, period);
    let max = min_max.max;
    let min = min_max.min;
    let end_date = moment(start_date);
    if (period === WEEKLY && start_date.get("isoWeek") > min) {
        end_date.add(1, "w");
    }
    while (start_date < timelineData.end) {
        if (period === WEEKLY) {
            end_date.endOf("isoWeek");
        } else if (period === MONTHLY) {
            end_date.endOf("M");
        } else {
            end_date.endOf("y");
        }
        max--;

        if (timestamp > 0) {
            pre_cells = cells_collection[timestamp - 1];
        }
        let all_cells = [];
        // while (row_count < cell_rows) {
        for (let row_count = 0; row_count < cells.length; row_count++) {
            let inner_cells = cells[row_count];
            let all_inner_cells = [];
            if (timestamp > 0) {
                pre_inner_cells = pre_cells[row_count];
            }
            // while (column_count < cell_columns) {
            for (let column_count = 0; column_count < inner_cells.length; column_count++) {
                let bounds = inner_cells[column_count].bounds;

                let total_quantity = 0;
                let total_weight = 0;
                for (let i = 1; i < allData.length; ++i) {
                    if (i < 932 || i > 17798) {
                        continue;
                    }
                    let lat_data = allData[i][2];
                    let lng_data = allData[i][3];
                    let date = moment(allData[i][1]);
                    if (lat_data > bounds[0][0] && lat_data <= bounds[1][0] && lng_data > bounds[0][1] && lng_data <= bounds[1][1]
                        && date > start_date && date <= end_date) {
                        let quantity_data = allData[i][4];
                        let weight_data = allData[i][5];
                        if (quantity_data.trim() !== "") {
                            total_quantity += parseInt(quantity_data);
                        }
                        if (weight_data.trim() !== "") {
                            total_weight += parseFloat(weight_data);
                        }
                        end_of_data_date = getDate(end_date); /*Added to include 0 value cells*/
                    }
                    // }
                }
                if (timestamp > 0) {
                    pre_inner_cell = pre_inner_cells[column_count];
                }
                /* Commented to include 0 value cells
                let date = getDate(end_date);
                if (total_weight > 0) {
                    if (pre_inner_cell !== null) {
                        total_quantity += pre_inner_cell.quantity;
                        total_weight += pre_inner_cell.weight;
                    }
                    if (quantity_max === null || total_quantity > quantity_max) {
                        quantity_max = total_quantity;
                    }
                    if (quantity_min === null || total_quantity < quantity_min) {
                        quantity_min = total_quantity;
                    }

                    if (weight_max === null || total_weight > weight_max) {
                        weight_max = total_weight;
                    }
                    if (weight_min === null || total_weight < weight_min) {
                        weight_min = total_weight;
                    }
                    all_inner_cells[column_count] = {
                        bounds: bounds,
                        quantity: total_quantity,
                        weight: total_weight,
                        date: date
                    };
                    end_of_data_date = date;
                } else if (pre_inner_cell !== null) {
                    all_inner_cells[column_count] = {
                        bounds: pre_inner_cell.bounds,
                        quantity: pre_inner_cell.quantity,
                        weight: pre_inner_cell.weight,
                        date: date
                    };
                } else {
                    all_inner_cells[column_count] = null;
                }*/
                if (pre_inner_cell !== null) {
                    total_quantity += pre_inner_cell.quantity;
                    total_weight += pre_inner_cell.weight;
                }
                if (quantity_max === null || total_quantity > quantity_max) {
                    quantity_max = total_quantity;
                }
                if (quantity_min === null || total_quantity < quantity_min) {
                    quantity_min = total_quantity;
                }

                if (weight_max === null || total_weight > weight_max) {
                    weight_max = total_weight;
                }
                if (weight_min === null || total_weight < weight_min) {
                    weight_min = total_weight;
                }
                all_inner_cells[column_count] = {
                    bounds: bounds,
                    quantity: total_quantity,
                    weight: total_weight,
                    date: getDate(end_date)
                };
            }
            all_cells[row_count] = all_inner_cells;
        }
        cells_collection.push(all_cells);
        timestamp++;
        if (max < min) {
            start_date.add(1, "y").startOf("y");
            min_max = getStepRange(start_date, period);
            max = min_max.max;
            min = min_max.min;
        }
        if (period === WEEKLY) {
            end_date.add(1, "w");
        } else if (period === MONTHLY) {
            end_date.add(1, "M");
        } else {
            end_date.add(1, "y");
        }
    }

    let features_collection = {
        type: "FeatureCollection",
        features: []
    };

    // Create rectangular cells on a timeline
    for (let k = 0; k < cells_collection.length; k++) {
        let cells = cells_collection[k];
        for (let i = 0; i < cells.length; i++) {
            let inner_cells = cells[i];
            for (let j = 0; j < inner_cells.length; j++) {
                let cell = inner_cells[j];
                if (cell !== null) {
                    let end = moment(cell.date);
                    let endDate = getDate(end);
                    if (end > end_of_data_date) { // Timeline upto last date of data collected
                        continue;
                    }
                    let startDate = getStartDate(end, period);
                    let value = normalized_rgb(cell.weight, weight_max, weight_min);

                    let bounds = [];
                    for (let a = 0; a < cell.bounds.length; a++) {
                        let bound = cell.bounds[a];
                        let bounds_comps = [];
                        for (let b = 0; b < bound.length; b++) {
                            bounds_comps[b] = bound[b].toString().match(/^-?\d+(?:\.\d{0,4})?/)[0];
                        }
                        bounds[a] = bounds_comps;
                    }
                    let dataString = `Lower bound: ${bounds[0][0]}, ${bounds[0][1]}<br>Upper bound: ${bounds[1][0]}, ${bounds[1][1]}<br>Weight: ${cell.weight} kg`;
                    let feature = {
                        type: "Feature",
                        geometry: {
                            type: "Polygon",
                            coordinates: [[[bounds[0][1], bounds[0][0]], [bounds[0][1], bounds[1][0]], [bounds[1][1], bounds[1][0]], [bounds[1][1], bounds[0][0]], [bounds[0][1], bounds[0][0]]]]
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
    }
    let dir_path = "plast_data/"
    fs.mkdir(dir_path, {recursive: true}, (err) => {
        if (err) throw err;
    });
    writeToFile(features_collection, dir_path + "cells_" + from + "_" + to + "_" + period + ".json")
};

const preComputeData = results => {
    for (let period of periods) {
        let max_year = moment().year();
        for (let i = max_year; i >= MIN_YEAR; i--) {
            for (let j = i; j >= MIN_YEAR; j--) {
                let cells = generateCells(lat_min, lng_min, lat_max, lng_max, cell_rows, cell_columns);
                createCells(results, cells, j, i, period);
            }
        }
    }
};

Papa.parse(data, {
    complete: function (results) {
        console.log("All done!");
        console.log('Complete ', results.data.length, ' records.');
        preComputeData(results);
    }
});
