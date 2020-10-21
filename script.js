document.addEventListener("DOMContentLoaded", allowLoading, false);

function allowLoading() { // Source: File API
    fetch("data/PlastOPol/database.csv")
        .then(response => response.text())
        .then(data => {
            Papa.parse(data, {
                complete: function (results) {
                    createCells(results);
                }
            });
        });
}

const createCells = results => {
    // const lat_min = 62.29277009577185, lat_max = 62.86852390984713, lng_min = 6.06296529018893, lng_max = 7.153935062865635; //Alesund
    const lat_min = 62, lat_max = 63, lng_min = 5.5, lng_max = 7.5; //Alesund
    // const lat_min = 67.775, lat_max = 69.35, lng_min = 12.5, lng_max = 16.15; // Lofoten
    let allData = results.data;

    const cell_rows = 16, cell_columns = 16;

    const half_cell_height = (lat_max - lat_min) / (2 * (cell_rows - 1));
    const half_cell_width = (lng_max - lng_min) / (2 * (cell_columns - 1));

    let quantity_max = null;
    let quantity_min = null;
    let weight_max = null;
    let weight_min = null;
    let cells_collection = [];
    let pre_cells = [];
    let pre_inner_cells = [];
    let pre_inner_cell = null;
    let timestamp = 0;
    let start_date = new Date(2019, 11, 31, 23, 59, 59);
    let interval = 7;
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    let end_of_data_date = new Date();
    while (start_date < tomorrow) {
        let end_date = new Date(start_date);
        end_date.setDate(end_date.getDate() + interval);
        let lat_point = lat_min;
        let row_count = 0;
        // let quantity_max = null;
        // let quantity_min = null;
        // let weight_max = null;
        // let weight_min = null;
        let cells = [];
        if (timestamp > 0) {
            pre_cells = cells_collection[timestamp - 1];
        }
        while (row_count < cell_rows) {
            let lng_point = lng_min;
            let column_count = 0;
            let inner_cells = [];
            if (timestamp > 0) {
                pre_inner_cells = pre_cells[row_count];
            }
            while (column_count < cell_columns) {
                let lat_0 = lat_point - half_cell_height;
                let lng_0 = lng_point - half_cell_width;
                let lat_1 = lat_point + half_cell_height;
                let lng_1 = lng_point + half_cell_width;
                let bounds = [[lat_0, lng_0], [lat_1, lng_1]];

                let total_quantity = 0;
                let total_weight = 0;
                for (let i = 1; i < allData.length; ++i) {
                    if (i < 931 && i > 2094) {
                        continue;
                    }
                    let lat_data = allData[i][2];
                    let lng_data = allData[i][3];
                    let date = new Date(allData[i][1]);
                    if (lat_data > lat_0 && lat_data <= lat_1 && lng_data > lng_0 && lng_data <= lng_1
                        && date > start_date && date <= end_date) {
                        let quantity_data = allData[i][4];
                        let weight_data = allData[i][5];
                        if (quantity_data.trim() !== "") {
                            total_quantity += parseInt(quantity_data);
                        }
                        if (weight_data.trim() !== "") {
                            total_weight += parseFloat(weight_data);
                        }
                    }
                }
                if (timestamp > 0) {
                    pre_inner_cell = pre_inner_cells[column_count];
                }
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
                    inner_cells[column_count] = {
                        bounds: bounds,
                        quantity: total_quantity,
                        weight: total_weight,
                        date: end_date
                    };
                    end_of_data_date = end_date;
                } else if (pre_inner_cell !== null) {
                    inner_cells[column_count] = {
                        bounds: bounds,
                        quantity: pre_inner_cell.quantity,
                        weight: pre_inner_cell.weight,
                        date: end_date
                    };
                } else {
                    inner_cells[column_count] = null;
                }
                lng_point += 2 * half_cell_width;
                column_count++;
            }
            cells[row_count] = inner_cells;
            lat_point += 2 * half_cell_height;
            row_count++;
        }
        // cells_collection.push({cells: cells, weight_max: weight_max, weight_min:weight_min});
        cells_collection.push(cells);
        timestamp++;
        start_date = new Date(end_date);
    }

    let features_collection = {
        type: "FeatureCollection",
        features: []
    };

    // Create rectangular cells on a timeline
    for (k = 0; k < cells_collection.length; k++) {
        let cells = cells_collection[k];
        // let weight_max = cells_collection[k].weight_max;
        // let weight_min = cells_collection[k].weight_min;
        for (i = 0; i < cells.length; i++) {
            let inner_cells = cells[i];
            for (j = 0; j < inner_cells.length; j++) {
                let cell = inner_cells[j];
                if (cell !== null) {
                    let end = cell.date;
                    if (end > end_of_data_date) { // Timeline upto last date of data collected
                        continue;
                    }
                    let start = new Date(end);
                    start.setDate(start.getDate() - interval);
                    start.setSeconds(start.getSeconds() + 1);
                    let value = normalized_rgb(cell.weight, weight_max, weight_min);

                    let bounds = []
                    for (a = 0; a < cell.bounds.length; a++) {
                        let bound = cell.bounds[a];
                        for (b = 0; b < bound.length; b++) {
                            bound[b] = bound[b].toString().match(/^-?\d+(?:\.\d{0,4})?/)[0];
                        }
                        bounds[a] = bound;
                    }
                    let dataString = `Lower bound: ${bounds[0][0]}, ${bounds[0][1]}<br>Upper bound: ${bounds[1][0]}, ${bounds[1][1]}<br>Weight: ${cell.weight} kg`;
                    let feature = L.rectangle(cell.bounds).toGeoJSON();
                    feature.properties = {
                        start: start,
                        end: end,
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
    createTimeline(features_collection);
    wasteMap.fitBounds([[lat_min, lng_min], [lat_max, lng_max]]);
};

const normalized_rgb = (old_val, max, min) => {
    if (max === min) {
        return 255;
    }
    return 255 - (old_val - min) * (255 / (max - min));
}

function createTimeline(features) {
    let featureTimeline = L.timeline(features, {
        style: feature => ({
            color: feature.properties.color,
            weight: feature.properties.weight,
            fillOpacity: feature.properties.fillOpacity
        }),
        onEachFeature: (feature, layer) => {
            layer.bindPopup(layer.feature.properties.description);
        }
    }).addTo(wasteMap);

    let slider = L.timelineSliderControl({
        formatOutput: date => new Date(date).toString(),
        showTicks: false
    });
    wasteMap.addControl(slider);

    slider.addTimelines(featureTimeline);
}


