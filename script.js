document.addEventListener("DOMContentLoaded", allowLoading, false);


function allowLoading() { // Source: File API

	// const saltSelector = document.getElementById('salt-selector');
  	// const ryddeSelector = document.getElementById('rydde-selector');
  	// const mdtSelector = document.getElementById('mdt-selector');
	//
	// saltSelector.addEventListener('change', (event) => {
	//
	//     	const fileList = event.target.files;
	//
	// 	Papa.parse(fileList[0], {
	// 		complete: function(results) {
	// 			showSALTResultsOnMap(results);
	// 		}
	// 	});
	//   });
	//
	// ryddeSelector.addEventListener('change', (event) => {
	//
	//     	const fileList = event.target.files;
	//
	// 	Papa.parse(fileList[0], {
	// 		complete: function(results) {
	// 			showRyddeResultsOnMap(results);
	// 		}
	// 	});
	//   });
	//
	// mdtSelector.addEventListener('change', (event) => {
	// 	const fileList = event.target.files;
	//
	// 	Papa.parse(fileList[0], {
	// 		complete: function (results) {
	// 			showMDTResultsOnMap(results);
	// 		}
	// 	});
	// });

	fetch("data/PlastOPol/database.csv")
		.then(response => response.text())
		.then(data => {
		Papa.parse(data, {
			complete: function(results) {
				// showDBResultsOnMap(results);
				createCells(results);
			}
		});
	});


}

function showRyddeResultsOnMap(results) {

	var greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-grey.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

var redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});



let allData = results.data;

	let templateString = "";

	for(let j=0; j<allData[0].length; ++j) {
		let indexesToAvoid = [125];
		if(indexesToAvoid.indexOf(j) == -1) { // if j is not in the array to avoid
			templateString += allData[0][j] + ": {" + j + "}<br/>";
		}
	}

	for(let i=1; i<allData.length; ++i) {
		if(allData[i][125]!=undefined && allData[i][17] != "") {
				let currentString = templateString;
				for(let k=0; k<allData[i].length; ++k) {
					let toReplace = "{" + k + "}";
					currentString = currentString.replace(toReplace, allData[i][k]);
					if(allData[i][k] == 0 || allData[i][k] == "0%" || allData[i][k] == "") {
						// Replace the entire line
						currentString = currentString.replace(allData[0][k] + ": " + allData[i][k] + "<br/>", "");
					}
				}
			

			let parsedPoint = parseWktPoint(allData[i][125]);
			
			proj4.defs([
			['EPSG:32633',
			'+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs']
			]);

			let convertedPoint = proj4('EPSG:32633', 'EPSG:4326', parsedPoint);

			if(allData[i][17] < 50) {
				L.marker([convertedPoint[1], convertedPoint[0]], {icon: greenIcon}).addTo(wasteMap).bindPopup(currentString);
			}
			else if(allData[i][17] < 300) {
				L.marker([convertedPoint[1], convertedPoint[0]], {icon: yellowIcon}).addTo(wasteMap).bindPopup(currentString);
			}
			else {
				L.marker([convertedPoint[1], convertedPoint[0]], {icon: redIcon}).addTo(wasteMap).bindPopup(currentString);
			}
			    
			
		}
	}


}

function showSALTResultsOnMap(results) {

var greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  //shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  //shadowSize: [41, 41]
});

var yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  //shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  //shadowSize: [41, 41]
});

var redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  //shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  //shadowSize: [41, 41]
});

	let allData = results.data;
	let templateString = "";

	for(let j=0; j<allData[0].length; ++j) {
		let indexesToAvoid = [0, 2, 4, 5, 6, 7, 8, 9];
		if(indexesToAvoid.indexOf(j) == -1) { // if j is not in the array to avoid
			templateString += allData[0][j] + ": {" + j + "}<br/>";
		}
	}

	for(let i=1; i<allData.length; ++i) {
		if(allData[i][10]!=undefined && allData[i][11]!=undefined && allData[i][14]>0) {
				let currentString = templateString;
				for(let k=0; k<allData[i].length; ++k) {
					let toReplace = "{" + k + "}";
					currentString = currentString.replace(toReplace, allData[i][k]);
					if(allData[i][k] == 0 || allData[i][k] == "0%" || allData[i][k] == "") {
						// Replace the entire line
						currentString = currentString.replace(allData[0][k] + ": " + allData[i][k] + "<br/>", "");
					}
				}
			

		if(allData[i][14]<50) {
			L.marker([allData[i][10], allData[i][11]], {icon: greenIcon}).addTo(wasteMap).bindPopup(currentString);
		}
		else if(allData[i][14]<200) {
			L.marker([allData[i][10], allData[i][11]], {icon: yellowIcon}).addTo(wasteMap).bindPopup(currentString);
		}
		else {
			L.marker([allData[i][10], allData[i][11]], {icon: redIcon}).addTo(wasteMap).bindPopup(currentString);
		}
		}
	}

}


function parseWktPoint(stringPoint) {
	let output = stringPoint.replace("POINT(","");
	output = output.replace(")","");
	output = output.split(" ");
	for(let o=0; o<output.length; ++o) {
		output[o] = parseFloat(output[o]);
	}
	return output;
}

/*function convertCoordinates(x, y) {
	let urlResult = "http://epsg.io/trans?x=" + x + "&y=" + y + "&z=0&s_srs=32633&t_srs=4326";
	let convertedCoordinates = undefined;

	var xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function() {
	    if (this.readyState == 4 && this.status == 200) {
		JSONtext = xhttp.responseText;
		convertedCoordinates = JSON.parse(JSONtext);
		console.log(convertedCoordinates);
	    }
	};
	xhttp.open("GET", urlResult, true);
	xhttp.send();
}*/

const createCells = results => {
	// const lat_min = 62.29277009577185, lat_max = 62.86852390984713, lng_min = 6.06296529018893, lng_max = 7.153935062865635; //Alesund
	const lat_min = 67.775, lat_max = 69.35, lng_min = 12.5, lng_max = 16.15; // Lofoten
	let allData = results.data;

	const cell_rows = 28, cell_columns = 28;

	const half_cell_height = (lat_max - lat_min)/(2*(cell_rows - 1));
	const half_cell_width = (lng_max - lng_min)/(2*(cell_columns - 1));

	let lat_point = lat_min;
	let row_count = 0;
	let quantity_max = null;
	let quantity_min = null;
	let weight_max = null;
	let weight_min = null;
	let cells = [];
	while (row_count < cell_rows){
		let lng_point = lng_min;
		let column_count = 0;
		let inner_cells = [];
		while (column_count < cell_columns) {
			let lat_0 = lat_point - half_cell_height;
			let lng_0 = lng_point - half_cell_width;
			let lat_1 = lat_point + half_cell_height;
			let lng_1 = lng_point + half_cell_width;
			let bounds = [[lat_0, lng_0], [lat_1, lng_1]];

			let total_quantity = 0;
			let total_weight = 0;
			for (let i = 1; i < allData.length; ++i) {
				if(i<931 && i>2094){
					continue;
				}
					let lat_data = allData[i][2];
					let lng_data = allData[i][3];
					if(lat_data > lat_0 && lat_data <= lat_1 && lng_data > lng_0 && lng_data <= lng_1) {
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
			if (quantity_max === null || total_quantity > quantity_max){
				quantity_max = total_quantity;
			}
			if (quantity_min === null || total_quantity < quantity_min){
				quantity_min = total_quantity;
			}

			if (weight_max === null || total_weight > weight_max){
				weight_max = total_weight;
			}
			if (weight_min === null || total_weight < weight_min){
				weight_min = total_weight;
			}
			inner_cells[column_count] = {bounds: bounds, quantity: total_quantity, weight: total_weight};
			lng_point += 2*half_cell_width;
			column_count++;
		}
		cells[row_count] = inner_cells;
		lat_point += 2*half_cell_height;
		row_count++;
	}

	for(i=0; i<cells.length; i++){
		let inner_cells =  cells[i];
		for(j=0; j<inner_cells.length; j++){
			let cell = inner_cells[j];
			let value = normalized_rgb(cell.weight, weight_max, weight_min)

			let dataString = `Weight: ${cell.weight} kg`;
			// create a grayscale rectangle
			L.rectangle(cell.bounds, {color: "rgb("+value+", "+value+", "+value+")", weight: 0, fillOpacity: 0.8}).addTo(wasteMap).bindPopup(dataString);
		}
	}
	wasteMap.fitBounds([[lat_min, lng_min], [lat_max, lng_max]]);
};

function normalized_rgb(old_val, max, min){
	return 255 - (old_val - min)*(255/(max-min));
}

function showDBResultsOnMap(results) {
	var greenIcon = new L.Icon({
		iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
		//shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		//shadowSize: [41, 41]
	});

	var yellowIcon = new L.Icon({
		iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
		//shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		//shadowSize: [41, 41]
	});

	var redIcon = new L.Icon({
		iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
		//shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		//shadowSize: [41, 41]
	});

	let allData = results.data;

	for (let i = 1; i < allData.length; ++i) {
		if (allData[i][4] !== undefined) {
			let dataString = `Date: ${allData[i][1]}<br> Lat: ${allData[i][2]}<br> Lng: ${allData[i][3]}<br> Qt: ${allData[i][4]}<br>`;

			if(allData[i][4]<50) {
				L.marker([allData[i][2], allData[i][3]], {icon: greenIcon}).addTo(wasteMap).bindPopup(dataString);
			}
			else if(allData[i][4]<200) {
				L.marker([allData[i][2], allData[i][3]], {icon: yellowIcon}).addTo(wasteMap).bindPopup(dataString);
			}
			else {
				L.marker([allData[i][2], allData[i][3]], {icon: redIcon}).addTo(wasteMap).bindPopup(dataString);
			}
		}
	}
}

function showMDTResultsOnMap(results) {
	var yellowIcon = new L.Icon({
		iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
		//shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
		iconSize: [25, 41],
		iconAnchor: [12, 41],
		popupAnchor: [1, -34],
		//shadowSize: [41, 41]
	});

	let allData = results.data;

	let points  = {
		type: "FeatureCollection",
		features: []
	};

	let end = moment().format("YYYY-MM-DD");

	for (let i = 1; i < allData.length; ++i) {
		if (allData[i][39] === 'NO' && (allData[i][18] !== undefined && allData[i][19] !== undefined)) {
			// let dataString = `Description: ${allData[i][37]}<br> Location: ${allData[i][26]}<br>`;

			// L.marker([allData[i][18], allData[i][19]], {icon: yellowIcon}).addTo(wasteMap).bindTooltip(dataString);
			let start = moment(allData[i][28], "DD-MM-YYYY hh:mm").format("YYYY-MM-DD");
			if (start === "Invalid date") {
				start = moment(allData[i][28], "MM//DD/YYYY hh:mm").format("YYYY-MM-DD");
			}
			console.log(start);
			let feature = createTimelineFeature("Point", start, end, allData[i][19], allData[i][18]);
			points.features.push(feature);
		}
	}
	createTimeline(points);
}

function createTimelineFeature(type, start, end, lng, lat) {
	return {
		type: "Feature",
		properties: {
			start: start,
			end: end
		},
		geometry: {
			type: type,
			coordinates: [lng, lat]
		}
	}

}


function createTimeline(features) {
	let pointTimeline = L.timeline(features).addTo(wasteMap);

	let slider = L.timelineSliderControl({
		formatOutput: function (date) {
			return moment(date).format("YYYY-MM-DD");
		},
	});
	wasteMap.addControl(slider);

	slider.addTimelines(pointTimeline);
}

function testTimeline(){
	let geojsonFeature = {
		type: "FeatureCollection",
		features: [
			{
				type: "Feature",
				properties: {
					start: "1970-01-01",
					end: "2014-12-04"
				},
				geometry: {
					type: "Point",
					coordinates: [6.086425781,62.4587092]
				}
			},
			{
				type: "Feature",
				properties: {
					start: "1970-01-01",
					end: "2015-12-04"

				},
				geometry: {
					type: "Point",
					coordinates: [5.937423706,62.47172371]
				}
			},
			{
				type: "Feature",
				properties: {
					start: "1970-01-01",
					end: "2016-12-04"
				},
				geometry: {
					type: "Point",
					coordinates: [6.020507813,62.50851458]
				}
			},
			{
				type: "Feature",
				properties: {
					start: "1970-01-01",
					end: "2017-12-04"
				},
				geometry: {
					type: "Point",
					coordinates: [6.096725464,62.57089174]
				}
			},
			{
				type: "Feature",
				properties: {
					start: "1970-01-01",
					end: "2018-12-04"
				},
				geometry: {
					type: "Point",
					coordinates: [6.028060913,62.54589324]
				}
			},
			{
				type: "Feature",
				properties: {
					start: "1970-01-01",
					end: "2018-12-04"
				},
				geometry: {
					type: "Point",
					coordinates: [6.162643433,62.61166694]
				}
			}
		]
	};

	let myStyle = {
		"color": "#ff7800",
		"weight": 20,
		"opacity": 0.65
	};

	let pointTimeline = L.timeline(geojsonFeature, {
		style: myStyle
	}).addTo(wasteMap);

	let slider = L.timelineSliderControl({
		formatOutput: function (date) {
			return moment(date).format("YYYY-MM-DD");
		},
	});
	wasteMap.addControl(slider);

	slider.addTimelines(pointTimeline);
};


