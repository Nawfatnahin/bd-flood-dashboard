const fs = require('fs');

async function getBoundary() {
    try {
        const url = 'https://nominatim.openstreetmap.org/search.php?q=Rajshahi+District+Bangladesh&polygon_geojson=1&format=json';
        const res = await fetch(url, {
            headers: { 'User-Agent': 'Antigravity IDE Script' }
        });
        const data = await res.json();
        const geojson = data[0].geojson;
        const feature = {
            "type": "FeatureCollection",
            "features": [
                {
                    "type": "Feature",
                    "properties": { "name": "Rajshahi" },
                    "geometry": geojson
                }
            ]
        };
        fs.writeFileSync('d:\\Vs code file\\rajshahi-map\\boundary.geojson', JSON.stringify(feature, null, 2));
        console.log("Boundary saved!");
    } catch (e) {
        console.error(e);
    }
}
getBoundary();
