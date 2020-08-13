document.addEventListener("DOMContentLoaded", allowLoading, false);


function allowLoading() { // Source: File API

	const saltSelector = document.getElementById('salt-selector');
  	const ryddeSelector = document.getElementById('rydde-selector');

	saltSelector.addEventListener('change', (event) => {

	    	const fileList = event.target.files;

		Papa.parse(fileList[0], {
			complete: function(results) {
				showSALTResultsOnMap(results);
			}
		});
	  });

	ryddeSelector.addEventListener('change', (event) => {

	    	const fileList = event.target.files;

		Papa.parse(fileList[0], {
			complete: function(results) {
				showRyddeResultsOnMap(results);
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
		let indexesToAvoid = [0, 2, 4, 5, 6, 7, 8, 9];
		if(indexesToAvoid.indexOf(j) == -1) { // if j is not in the array to avoid
			templateString += allData[0][j] + ": {" + j + "}<br/>";
		}
	}

	for(let i=1; i<allData.length; ++i) {
		if(allData[i][125]!=undefined) {
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
			let convertedPoint = undefined;

			let urlResult = "http://epsg.io/trans?x=" + parsedPoint[0] + "&y=" + parsedPoint[1] + "&z=0&s_srs=32633&t_srs=4326";
			let convertedCoordinates = undefined;

			var xhttp = new XMLHttpRequest();
			xhttp.onreadystatechange = function() {
			    if (this.readyState == 4 && this.status == 200) {
				JSONtext = xhttp.responseText;
				convertedPoint = JSON.parse(JSONtext);
				console.log(convertedPoint);
				L.marker(convertedPoint, {icon: redIcon}).addTo(wasteMap).bindPopup(currentString);
			    }
			};
			xhttp.open("GET", urlResult, true);
			xhttp.send();
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




