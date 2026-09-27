/* =====================================================
   NAVIGO - SMART NAVIGATION
   Live Location + Routes + Nearby Places
   ===================================================== */


/* ================= MAP ================= */

const map = L.map("map", {
    zoomControl: true,
    attributionControl: true
}).setView([11.0168, 76.9558], 12);


/* Light Map */

L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    {
        maxZoom: 19,
        attribution:
            "Tiles &copy; Esri | OpenStreetMap contributors"
    }
).addTo(map);


/* ================= VARIABLES ================= */

let startMarker = null;
let destinationMarker = null;

let liveMarker = null;
let accuracyCircle = null;

let currentLiveLocation = null;

let routeLayers = [];

let nearbyMarkers = [];

let routeBounds = null;


/* ================= ELEMENTS ================= */

const startInput =
    document.getElementById("startLocation");

const destinationInput =
    document.getElementById("destination");

const locationBtn =
    document.getElementById("locationBtn");

const routeBtn =
    document.getElementById("routeBtn");

const message =
    document.getElementById("message");

const confirmedBox =
    document.getElementById("confirmedBox");

const distance =
    document.getElementById("distance");

const time =
    document.getElementById("time");

const routes =
    document.getElementById("routes");

const mapStatus =
    document.getElementById("mapStatus");

const recommendation =
    document.getElementById("recommendation");

const nearbyResult =
    document.getElementById("nearbyResult");

const fitRouteBtn =
    document.getElementById("fitRouteBtn");


/* ================= MESSAGE ================= */

function showMessage(text) {
    message.textContent = text;
}


/* ================= HTML SECURITY ================= */

function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


/* =====================================================
   LIVE LOCATION
   ===================================================== */

function useLiveLocation() {

    if (!navigator.geolocation) {

        showMessage(
            "Your browser does not support GPS location."
        );

        return;
    }


    showMessage(
        "Getting your live location..."
    );


    navigator.geolocation.watchPosition(

        function(position) {

            const lat =
                position.coords.latitude;

            const lon =
                position.coords.longitude;

            const accuracy =
                position.coords.accuracy;


            currentLiveLocation = {
                lat,
                lon
            };


            const coordinates =
                [lat, lon];


            /* CREATE LIVE MARKER */

            if (!liveMarker) {

                const icon =
                    L.divIcon({

                        className: "",

                        html:
                            `<div class="live-marker"></div>`,

                        iconSize: [24, 24],

                        iconAnchor: [12, 12]

                    });


                liveMarker =
                    L.marker(
                        coordinates,
                        {
                            icon: icon,
                            zIndexOffset: 1000
                        }
                    ).addTo(map);


                liveMarker.bindTooltip(
                    "You are here",
                    {
                        permanent: true,
                        direction: "top",
                        offset: [0, -12]
                    }
                );

            } else {

                liveMarker.setLatLng(
                    coordinates
                );

            }


            /* ACCURACY */

            if (!accuracyCircle) {

                accuracyCircle =
                    L.circle(
                        coordinates,
                        {
                            radius: accuracy,

                            color: "#06c9e5",

                            fillColor: "#06c9e5",

                            fillOpacity: 0.08,

                            weight: 1
                        }
                    ).addTo(map);

            } else {

                accuracyCircle.setLatLng(
                    coordinates
                );

                accuracyCircle.setRadius(
                    accuracy
                );

            }


            /* UPDATE INPUT */

            startInput.value =
                `Live Location (${lat.toFixed(5)}, ${lon.toFixed(5)})`;


            mapStatus.textContent =
                "Live location active";


            showMessage(
                "✓ Live location is active."
            );


            /* CENTER MAP FIRST TIME */

            if (!routeBounds) {

                map.setView(
                    coordinates,
                    16
                );

            }

        },

        function(error) {

            if (error.code === 1) {

                showMessage(
                    "Location permission denied. Allow GPS access."
                );

            } else if (error.code === 2) {

                showMessage(
                    "Unable to detect your location."
                );

            } else {

                showMessage(
                    "Location request timed out."
                );

            }

        },

        {
            enableHighAccuracy: true,
            maximumAge: 2000,
            timeout: 10000
        }
    );
}


/* LOCATION BUTTON */

locationBtn.addEventListener(
    "click",
    useLiveLocation
);


/* =====================================================
   GEOCODING
   ===================================================== */

async function searchLocation(place) {

    const url =
        "https://nominatim.openstreetmap.org/search" +
        "?format=json" +
        "&limit=1" +
        "&q=" +
        encodeURIComponent(place);


    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            "Location search failed."
        );
    }


    const data =
        await response.json();


    if (!data.length) {

        throw new Error(
            "Location not found."
        );
    }


    return {

        lat: parseFloat(data[0].lat),

        lon: parseFloat(data[0].lon),

        name: data[0].display_name

    };
}


/* =====================================================
   START LOCATION
   ===================================================== */

async function getStart() {

    if (currentLiveLocation) {

        return {

            lat: currentLiveLocation.lat,

            lon: currentLiveLocation.lon,

            name: "Live Location"

        };
    }


    const value =
        startInput.value.trim();


    if (!value) {

        throw new Error(
            "Enter starting location or use live location."
        );
    }


    return await searchLocation(value);
}


/* =====================================================
   START MARKER
   ===================================================== */

function createStartMarker(location) {

    if (startMarker) {

        map.removeLayer(
            startMarker
        );

    }


    const icon =
        L.divIcon({

            className: "",

            html:
                `<div class="start-marker"></div>`,

            iconSize: [28, 28],

            iconAnchor: [14, 14]

        });


    startMarker =
        L.marker(
            [location.lat, location.lon],
            {
                icon: icon
            }
        ).addTo(map);


    startMarker.bindPopup(
        `<strong>Starting Location</strong><br>
        ${escapeHTML(location.name)}`
    );
}


/* =====================================================
   DESTINATION MARKER
   ===================================================== */

function createDestinationMarker(location) {

    if (destinationMarker) {

        map.removeLayer(
            destinationMarker
        );

    }


    const icon =
        L.divIcon({

            className: "",

            html:
                `<div class="destination-marker"></div>`,

            iconSize: [28, 28],

            iconAnchor: [14, 14]

        });


    destinationMarker =
        L.marker(
            [location.lat, location.lon],
            {
                icon: icon
            }
        ).addTo(map);


    destinationMarker.bindPopup(
        `<strong>Destination</strong><br>
        ${escapeHTML(location.name)}`
    );
}


/* =====================================================
   CLEAR ROUTES
   ===================================================== */

function clearRoutes() {

    routeLayers.forEach(
        layer => {

            map.removeLayer(
                layer
            );

        }
    );


    routeLayers = [];
}


/* =====================================================
   DRAW ROUTE
   ===================================================== */

function drawRoute(route, index) {

    const coordinates =
        route.geometry.coordinates.map(
            point => [
                point[1],
                point[0]
            ]
        );


    const main =
        index === 0;


    const line =
        L.polyline(
            coordinates,
            {

                color:
                    main
                        ? "#665cff"
                        : "#ff9f5b",

                weight:
                    main
                        ? 6
                        : 4,

                opacity:
                    main
                        ? 0.95
                        : 0.65,

                dashArray:
                    main
                        ? null
                        : "9 8"

            }
        ).addTo(map);


    line.bindTooltip(
        main
            ? "Main Route"
            : `Alternative Route ${index}`,
        {
            sticky: true
        }
    );


    line.on(
        "click",
        function() {

            updateRouteInfo(
                route,
                index
            );

        }
    );


    routeLayers.push(
        line
    );
}


/* =====================================================
   ROUTE INFORMATION
   ===================================================== */

function updateRouteInfo(
    route,
    index
) {

    const km =
        route.distance / 1000;

    const minutes =
        route.duration / 60;


    distance.textContent =
        km < 1
            ? `${Math.round(route.distance)} m`
            : `${km.toFixed(1)} km`;


    time.textContent =
        `${Math.round(minutes)} min`;


    recommendation.innerHTML = `

        <div class="recommendation-icon">
            💡
        </div>

        <div>

            <strong>
                Smart Recommendation
            </strong>

            <p>
                ${
                    index === 0
                        ? "Main route selected. This is the primary route available."
                        : "Alternative route selected. This route gives you another travel option."
                }
            </p>

        </div>
    `;
}


/* =====================================================
   FIND ROUTE
   ===================================================== */

async function findRoute() {

    try {

        const destinationText =
            destinationInput.value.trim();


        if (!destinationText) {

            throw new Error(
                "Please enter your destination."
            );
        }


        showMessage(
            "Searching for your best route..."
        );


        mapStatus.textContent =
            "Finding route...";


        confirmedBox.classList.add(
            "hidden"
        );


        const start =
            await getStart();


        const destination =
            await searchLocation(
                destinationText
            );


        createStartMarker(
            start
        );


        createDestinationMarker(
            destination
        );


        clearRoutes();


        const url =
            `https://router.project-osrm.org/route/v1/driving/` +
            `${start.lon},${start.lat};` +
            `${destination.lon},${destination.lat}` +
            `?overview=full` +
            `&geometries=geojson` +
            `&alternatives=true` +
            `&steps=true`;


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Route service unavailable."
            );
        }


        const data =
            await response.json();


        if (
            data.code !== "Ok" ||
            !data.routes.length
        ) {

            throw new Error(
                "No route found."
            );
        }


        /* DRAW ROUTES */

        data.routes.forEach(
            (route, index) => {

                drawRoute(
                    route,
                    index
                );

            }
        );


        const mainRoute =
            data.routes[0];


        updateRouteInfo(
            mainRoute,
            0
        );


        routes.textContent =
            data.routes.length;


        /* BOUNDS */

        routeBounds =
            L.latLngBounds(
                [
                    [start.lat, start.lon],
                    [
                        destination.lat,
                        destination.lon
                    ]
                ]
            );


        mainRoute.geometry.coordinates
            .forEach(
                point => {

                    routeBounds.extend(
                        [
                            point[1],
                            point[0]
                        ]
                    );

                }
            );


        map.fitBounds(
            routeBounds,
            {
                padding: [35, 35]
            }
        );


        /* SUCCESS */

        confirmedBox.classList.remove(
            "hidden"
        );


        confirmedBox.textContent =
            "✓ Route successfully confirmed";


        mapStatus.textContent =
            "Route ready";


        showMessage(
            "✓ Your route is ready."
        );


        nearbyResult.textContent =
            "Choose Hospital, Petrol Station or Restaurant to explore nearby places.";

    } catch (error) {

        console.error(error);

        showMessage(
            "⚠ " + error.message
        );

        mapStatus.textContent =
            "Waiting for route";

    }
}


/* FIND ROUTE */

routeBtn.addEventListener(
    "click",
    findRoute
);


/* ENTER KEY */

destinationInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {

            findRoute();

        }

    }
);


/* =====================================================
   FIT ROUTE
   ===================================================== */

fitRouteBtn.addEventListener(
    "click",
    function() {

        if (routeBounds) {

            map.fitBounds(
                routeBounds,
                {
                    padding: [35, 35]
                }
            );

        } else if (liveMarker) {

            map.setView(
                liveMarker.getLatLng(),
                16
            );

        } else {

            map.setView(
                [11.0168, 76.9558],
                12
            );

        }

    }
);


/* =====================================================
   NEARBY PLACES
   ===================================================== */

async function findNearby(type) {

    try {

        if (!destinationMarker) {

            nearbyResult.textContent =
                "Please find a route first.";

            return;
        }


        const point =
            destinationMarker.getLatLng();


        nearbyResult.textContent =
            "Searching nearby places...";


        /* CLEAR OLD MARKERS */

        nearbyMarkers.forEach(
            marker => {

                map.removeLayer(
                    marker
                );

            }
        );


        nearbyMarkers = [];


        let query = "";


        if (type === "hospital") {

            query = `
                (
                    node["amenity"="hospital"]
                    (around:5000,${point.lat},${point.lng});

                    way["amenity"="hospital"]
                    (around:5000,${point.lat},${point.lng});

                    node["healthcare"="hospital"]
                    (around:5000,${point.lat},${point.lng});

                    way["healthcare"="hospital"]
                    (around:5000,${point.lat},${point.lng});
                );
            `;

        }


        if (type === "fuel") {

            query = `
                (
                    node["amenity"="fuel"]
                    (around:5000,${point.lat},${point.lng});

                    way["amenity"="fuel"]
                    (around:5000,${point.lat},${point.lng});
                );
            `;

        }


        if (type === "restaurant") {

            query = `
                (
                    node["amenity"="restaurant"]
                    (around:5000,${point.lat},${point.lng});

                    way["amenity"="restaurant"]
                    (around:5000,${point.lat},${point.lng});
                );
            `;

        }


        const overpass =
            `[out:json];${query}out center;`;


        const servers = [

            "https://overpass-api.de/api/interpreter",

            "https://overpass.kumi.systems/api/interpreter"

        ];


        let data = null;


        for (
            const server of servers
        ) {

            try {

                const response =
                    await fetch(
                        server,
                        {
                            method: "POST",

                            body: overpass,

                            headers: {
                                "Content-Type":
                                    "text/plain"
                            }
                        }
                    );


                if (response.ok) {

                    data =
                        await response.json();

                    break;

                }

            } catch (error) {

                console.log(
                    "Trying another server..."
                );

            }

        }


        if (!data) {

            throw new Error(
                "Nearby places unavailable."
            );

        }


        const places =
            data.elements.slice(
                0,
                10
            );


        if (!places.length) {

            nearbyResult.textContent =
                "No nearby places found.";

            return;
        }


        let html = "";


        places.forEach(
            place => {

                const lat =
                    place.lat ??
                    place.center?.lat;

                const lon =
                    place.lon ??
                    place.center?.lon;


                if (
                    lat === undefined ||
                    lon === undefined
                ) {

                    return;

                }


                const name =
                    place.tags?.name ||
                    "Unnamed Place";


                const color =
                    type === "hospital"
                        ? "#ff4f67"
                        : type === "fuel"
                        ? "#ffad4d"
                        : "#36db91";


                const marker =
                    L.circleMarker(
                        [lat, lon],
                        {
                            radius: 7,

                            color: color,

                            fillColor: color,

                            fillOpacity: 0.85,

                            weight: 2
                        }
                    ).addTo(map);


                marker.bindTooltip(
                    escapeHTML(name),
                    {
                        permanent: true,

                        direction: "top",

                        offset: [0, -8]
                    }
                );


                marker.bindPopup(`

                    <strong>
                        ${escapeHTML(name)}
                    </strong>

                    <br>

                    ${
                        type === "hospital"
                            ? "🏥 Hospital"
                            : type === "fuel"
                            ? "⛽ Petrol Station"
                            : "🍴 Restaurant"
                    }

                `);


                nearbyMarkers.push(
                    marker
                );


                html += `

                    <div class="nearby-item">

                        <strong>
                            ${escapeHTML(name)}
                        </strong>

                        <span>
                            ${
                                type === "hospital"
                                    ? "Hospital"
                                    : type === "fuel"
                                    ? "Petrol Station"
                                    : "Restaurant"
                            }
                        </span>

                    </div>

                `;

            }
        );


        nearbyResult.innerHTML =
            html ||
            "No nearby places found.";

    } catch (error) {

        console.error(error);

        nearbyResult.textContent =
            "Unable to load nearby places.";

    }
}


/* ================= NEARBY BUTTONS ================= */

document
    .querySelectorAll(".nearby-btn")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                function() {

                    findNearby(
                        button.dataset.type
                    );

                }
            );

        }
    );