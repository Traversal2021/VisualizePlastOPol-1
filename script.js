document.addEventListener("DOMContentLoaded", allowLoading, false);

const WEEKLY = "Weekly", MONTHLY = "Monthly", YEARLY = "Yearly";
const MIN_YEAR = 2013;
const lat_min = 62.345252708439276, lat_max = 62.61474729156072, lng_min = 5.978375939307136,
    lng_max = 6.561624060692863; //Svinøya 30x30

let interval = WEEKLY;
let timeline;
let timelineSlider;
let box;
let isInit = true;

function allowLoading() { // Source: File API
    visualize(true);

    L.control.custom({
        position: 'topleft',
        content: '<b>Type:</b><input type="radio" id="points" name="type" value="points" checked><label for="points">Points</label>' +
            '<input type="radio" id="cells" name="type" value="cells"><label for="cells">Cells</label>',
        events:
            {
                change: event => {
                    visualize(false);
                },
            }
    }).addTo(wasteMap);

    L.control.custom({
        position: 'topleft',
        content: "<b>From:</b><select id='from-year-dropdown'></select>&nbsp;" +
            "<b>To:</b><select id='to-year-dropdown'></select>",
        events:
            {
                change: event => {
                    visualize(false);
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

    box = L.control.messagebox({position: "topleft"}).addTo(wasteMap);

    isInit = false;
}

const fill_options = select => {
    let max = moment().year();
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
    if (!isInit) {
        visualize(false);
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

const getDate = instance => instance.format("YYYY-MM-DD HH:mm");

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
            let data = {points: points, start: getDate(start_date), end: getDate(end_date)};
            points_collection.push(data);
        }

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

    if (points_collection.length === 0) {
        box.show("<b>No data</b>");
        return;
    }

    let features_collection = {
        type: "FeatureCollection",
        features: []
    };

    // Drop points in a rectangular cell on a timeline
    for (let k = 0; k < points_collection.length; k++) {
        let data = points_collection[k];
        let points = data.points;
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
                    start: data.start,
                    end: data.end,
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

function createTimeline(features) {
    if (features.features.length > 0) {
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
    } else {
        box.show("<b>No data</b>");
    }
}

const log_normalized_radius = (enteredValue, minEntry, maxEntry, normalizedMin, normalizedMax) => {
    let mx = (Math.log((enteredValue - minEntry)) / (Math.log(maxEntry - minEntry)));
    const preshiftNormalized = mx * (normalizedMax - normalizedMin);
    return preshiftNormalized + normalizedMin;
};

const visualize = isInit => {
    let from = moment().year();
    let to = from;
    let isPoints = false;
    if (!isInit) {
        wasteMap.removeControl(timelineSlider);
        wasteMap.removeLayer(timeline);
        let from_select = document.getElementById('from-year-dropdown'),
            to_select = document.getElementById('to-year-dropdown');

        from = parseInt(from_select.value);
        to = parseInt(to_select.value);
        if (from > to) {
            box.show("<b>Please select a valid year range</b>");
            return;
        }
        let points = document.getElementById('points');
        isPoints = points !== null && points.checked;
    }

    createLayers(from, to, isPoints || isInit);
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
