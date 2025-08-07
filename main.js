(function(){

    //create map in leaflet and tie it to the div called 'theMap'
    var map = L.map('theMap').setView([42, -60], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

    // Creating the plane icon
    var planeIcon = L.icon({
        iconUrl: 'plane4-45.png',
        iconSize: [50, 50],     // Icon is 50px by 50px
        iconAnchor: [25, 25],   // Setting the anchor to the center of the icon
        popupAnchor: [0, -25]   // Popup is 25px above icon
    });

    var markerLayer = new L.LayerGroup();
    markerLayer.addTo(map);

    GetJSON();

    // setInterval(GetJSON, 7000);

    async function GetJSON() {
        let response = await fetch('https://opensky-network.org/api/states/all');
        let data = await response.json();

        // Clear the previous markers
        markerLayer.clearLayers();

        Coords = FilterData(data);
        PlotMarkers(Coords);
    }

    function FilterData(json) {

        // Log all flights within Canada
        FilteredData = json["states"].filter(flight => flight[2].match("Canada"));
        console.log("%c Filtered JSON data:", "color: #389fff");
        console.log(FilteredData);

        // Using the map function to format the data for easier use later
        Coords = FilteredData.map((flight) => {
            return { callsign: flight[1], longitude: flight[5], latitude: flight[6], on_ground: flight[8], direction: flight[10] }
        });

        return Coords;
    } // End FilterData

    function PlotMarkers(Coords) {

        // Creating an array for geojson data
        var geojson = [];

        // Using map to loop through the coords data and transform each flight into geoJSON format.
        // Then push the new geoJSON object the the geojson array
        Coords.map(flight => {
            if(flight.longitude != null && flight.latitude != null) {
                let geojsonFlight = {
                    "type": "Feature",
                    "properties": {
                        "name": flight.callsign,
                        "popupContent": "Flight Number: " + flight.callsign + "Grounded: " + flight.on_ground,
                        "link": "https://www.flightaware.com/live/flight/" + flight.callsign,
                        "direction": flight.direction
                    },
                    "geometry": {
                        "type": "Point",
                        "coordinates": [flight.longitude, flight.latitude]
                    }
                }

                geojson.push(geojsonFlight);
            }
        });

        // Logging the geoJSON objects
        console.log("%c Converted geoJSON data:", "color: #389fff");
        console.log(geojson);

        // Add all markers to the map, create the popup content, and set and rotate the icon
        // POPUP CONTENT LAYOUT
        // FlightInformation:
        // Flight Number: CALLSIGN Grounded: BOOL
        // More Information: LINK
    
        L.geoJson(geojson, {
            onEachFeature: function(feature, layer){
                content = "<b>Flight Information:</b><br>" + feature.properties.popupContent + 
                "<br>" + '<a href="' + feature.properties.link + '">More Information</a>'; 
                layer.bindPopup(content);
                layer.setIcon(planeIcon);
                layer.setRotationAngle(feature.properties.direction)
                layer.setRotationOrigin('center center');
                markerLayer.addLayer(layer);
            },
        });
    } // End PlotMarkers

})()