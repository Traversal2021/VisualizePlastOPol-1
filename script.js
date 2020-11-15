document.addEventListener("DOMContentLoaded", allowLoading, false);

const WEEKLY = "Weekly", MONTHLY = "Monthly", YEARLY = "Yearly";
const MIN_YEAR = 2013;
const lat_min = 62.345252708439276, lat_max = 62.61474729156072, lng_min = 5.978375939307136,
    lng_max = 6.561624060692863; //Svinøya 30x30

let interval = WEEKLY;
let timeline;
let timelineSlider;

function allowLoading() { // Source: File API
    visualize(true);

    L.control.custom({
        position: 'topleft',
        content: '<b>Type:</b><input type="radio" id="points" name="type" value="points" checked><label for="points">Points</label>' +
            '<input type="radio" id="cells" name="type" value="cells"><label for="cells">Cells</label>',
    }).addTo(wasteMap);

    L.control.custom({
        position: 'topleft',
        content: "<b>From:</b><select id='from-year-dropdown'></select>&nbsp;" +
            "<b>To:</b><select id='to-year-dropdown'></select> &nbsp;" +
            "<button id='display-button'>Display</button>",
        events:
            {
                click: event => {
                    if (event.target.id === "display-button") {
                        visualize(false);
                    }
                },
            }
    }).addTo(wasteMap);

    fill_options(document.getElementById('from-year-dropdown'));
    fill_options(document.getElementById('to-year-dropdown'));

    L.control.timelineSlider({
        position: "topleft",
        timelineItems: [WEEKLY, MONTHLY, YEARLY],
        extraChangeMapParams: {},
        changeMap: changeMapFunction
    }).addTo(wasteMap);
}

const fill_options = select => {
    let max = new Date().getFullYear();
    for (let i = MIN_YEAR; i <= max; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.innerHTML = i;
        if (i === max) {
            opt.setAttribute("selected", "selected");
        }
        select.appendChild(opt);
    }
};

const changeMapFunction = obj => {
    interval = obj.label;
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


/*const createCells = (results, from, to, period) => {
    // const lat_min = 62.29277009577185, lat_max = 62.86852390984713, lng_min = 6.06296529018893, lng_max = 7.153935062865635; //Alesund
    const lat_min = 62.46, lat_max = 62.56, lng_min = 6.15, lng_max = 6.35; //Alesund
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
    /!*let start_date = new Date(2019, 11, 31, 23, 59, 59);
    let interval = 7;
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);*!/
    let end_of_data_date = new Date();
    let timelineData = setupTimeline(from, to, period);
    let start_date = timelineData.start;
    let interval = timelineData.interval;
    while (start_date < timelineData.tomorrow) {
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
                    if (i < 932 || i > 2094) {
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
                        let bounds_comps = [];
                        for (b = 0; b < bound.length; b++) {
                            bounds_comps[b] = bound[b].toString().match(/^-?\d+(?:\.\d{0,4})?/)[0];
                        }
                        bounds[a] = bounds_comps;
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
    wasteMap.fitBounds([[lat_min - 0.05, lng_min - 0.05], [lat_max + 0.05, lng_max + 0.05]]);
};*/

const createPoints = (results, from, to, period) => {
    let latLng = L.latLng(62.48, 6.27); //Svinøya
    let side = 30000; //Bound length in m
    let bounds = latLng.toBounds(side);
    let allData = results.data;

    let weight_max = null;
    let weight_min = null;
    let points_collection = [];

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

        let weight = 0;
        let points = [];
        for (let i = 1; i < allData.length; i++) {
            if (i < 932 || i > 17798) {
                continue;
            }
            let lat_data = allData[i][2];
            let lng_data = allData[i][3];
            let point = L.latLng(lat_data, lng_data);
            let date = moment(allData[i][1]);
            if (bounds.contains(point) && date > start_date && date <= end_date) {
                let weight_data = allData[i][5];
                if (weight_data.trim() !== "") {
                    weight = parseFloat(weight_data);
                }

                if (weight > 0) {
                    if (weight_max === null || weight > weight_max) {
                        weight_max = weight;
                    }
                    if (weight_min === null || weight < weight_min) {
                        weight_min = weight;
                    }
                    point.alt = weight;
                    points.push(point);
                }
            }
        }
        if (points.length > 0) {
            let data = {points: points, date: getDate(end_date)};
            points_collection.push(data);
        }
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

    // Drop points in a rectangular cell on a timeline
    for (let k = 0; k < points_collection.length; k++) {
        let data = points_collection[k];
        let points = data.points;
        let end = moment(data.date);
        let endDate = getDate(end);
        let startDate = getStartDate(end, period);
        for (let i = 0; i < points.length; i++) {
            let point = points[i];
            let dataString = `Coordinates: [${point.lat}, ${point.lng}]<br>Weight: ${point.alt} kg`;
            let feature = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [point.lng, point.lat]
                },
                properties: {
                    start: startDate,
                    end: endDate,
                    color: "#000000",
                    weight: 0,
                    fillOpacity: 1,
                    description: dataString,
                    points: points,
                    radius: log_normalized_radius(point.alt, weight_min - 1, weight_max, 5, 25)
                }
            };
            features_collection.features.push(feature);
        }
    }
    createTimeline(features_collection);
    wasteMap.fitBounds([[bounds.getSouth() - 0.05, bounds.getWest() - 0.05], [bounds.getNorth() + 0.05, bounds.getEast() + 0.05]]);
};

const normalized_rgb = (old_val, max, min) => {
    if (max === min) {
        return 255;
    }
    return 255 - (old_val - min) * (255 / (max - min));
};

function createTimeline(features) {
    let featureTimeline = L.timeline(features, {
        pointToLayer: function (feature, latlng) {
            return L.circleMarker(latlng, {
                radius: feature.properties.radius,
            });
        },
        style: feature => ({
            color: feature.properties.color,
            weight: feature.properties.weight,
            fillOpacity: 0.5
        }),
        onEachFeature: (feature, layer) => {
            layer.bindPopup(layer.feature.properties.description);
        }
    }).addTo(wasteMap);

    let slider = L.timelineSliderControl({
        formatOutput: date => getDate(moment(date)),
        showTicks: false
    });
    wasteMap.addControl(slider);

    slider.addTimelines(featureTimeline);
    timeline = featureTimeline;
    timelineSlider = slider;
}

const log_normalized_radius = (enteredValue, minEntry, maxEntry, normalizedMin, normalizedMax) => {
    let mx = (Math.log((enteredValue - minEntry)) / (Math.log(maxEntry - minEntry)));
    const preshiftNormalized = mx * (normalizedMax - normalizedMin);
    return preshiftNormalized + normalizedMin;
};

const visualize = init => {
    let from = new Date().getFullYear();
    let to = from;
    let isPoints = false;
    if (!init) {
        wasteMap.removeControl(timelineSlider);
        wasteMap.removeLayer(timeline);
        let from_select = document.getElementById('from-year-dropdown'),
            to_select = document.getElementById('to-year-dropdown');

        from = parseInt(from_select.value);
        to = parseInt(to_select.value);
        if (from > to) {
            alert("Please select a valid year range");
        }
        let points = document.getElementById('points');
        isPoints = points !== null && points.checked;
    }

    createLayers(from, to, isPoints || init);
};

const createLayers = (from, to, isPoints) => {
    if (isPoints) {
        wasteMap.spin(true);
        fetch("data/PlastOPol/database.csv")
            .then(response => response.text())
            .then(data => {
                Papa.parse(data, {
                    complete: function (results) {
                        createPoints(results, from, to, interval)
                        wasteMap.spin(false);
                    }
                });
            });
    } else {
        wasteMap.spin(true);
        fetch("data/PlastOPol/plast_o_pol_data/plast_data/cells_" + from + "_" + to + "_" + interval + ".json")
            .then(response => response.text())
            .then(data => {
                let features = JSON.parse(data);
                createTimeline(features);
                wasteMap.spin(false);
            });
        wasteMap.fitBounds([[lat_min - 0.05, lng_min - 0.05], [lat_max + 0.05, lng_max + 0.05]]);
    }
};
