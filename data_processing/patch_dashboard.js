const fs = require('fs');

// Read the geo compact JSON
const geoJson = fs.readFileSync('flood-dashboard/geo_compact.txt', 'utf8').trim();

// Read the dashboard HTML
let html = fs.readFileSync('flood-dashboard/bangladesh-flood-gis.html', 'utf8');

// 1. Replace GeoJSON block
const geoStart = html.indexOf('const GEO =');
const geoEnd = html.indexOf(']};', geoStart) + 3;
html = html.slice(0, geoStart) + 'const GEO = ' + geoJson + ';' + html.slice(geoEnd);

// 2. Fix transparency bug: mouseover keeps slight highlight
html = html.replace(
  "mouseover: e => { if(selLyr!==lyr) e.target.setStyle({fillOpacity:1, weight:3, color:\"#fff\"}); }",
  "mouseover: e => { if(selLyr!==lyr) e.target.setStyle({fillOpacity:0.55, weight:2.5, color:\"rgba(255,255,255,0.5)\"}); }"
);

// 3. Fix mouseout: reset to base 0.32
html = html.replace(
  "mouseout: e => { if(selLyr!==lyr) e.target.setStyle({fillOpacity:0.85, weight:2, color:\"#000\"}); }",
  "mouseout: e => { if(selLyr!==lyr) e.target.setStyle({fillOpacity:0.32, weight:1.5, color:\"rgba(255,255,255,0.25)\"}); }"
);

// 4. Fix deselect in selectDiv: reset old layer to 0.32
html = html.replace(
  "if(selLyr) selLyr.setStyle({fillOpacity:0.32, weight:1.5, color:\"rgba(255,255,255,0.25)\"});",
  "if(selLyr) selLyr.setStyle({fillOpacity:0.32, weight:1.5, color:\"rgba(255,255,255,0.25)\"});"
);

// 5. Fix selected layer: use 0.65 (prominent but transparent)
html = html.replace(
  "lyr.setStyle({fillOpacity:1, weight:4, color:\"#4ade80\"});",
  "lyr.setStyle({fillOpacity:0.65, weight:3, color:\"#4ade80\"});"
);

fs.writeFileSync('flood-dashboard/bangladesh-flood-gis.html', html);
console.log('Done! HTML size: ' + html.length + ' chars');
