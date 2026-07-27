import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = path.join(repositoryRoot, "app", "data");
const routeEndpoint = "https://router.project-osrm.org/table/v1/driving";

const bases = {
  Altaussee: { lat: 47.661053, lon: 13.742943 },
  "Zell am See": { lat: 47.3045791, lon: 12.7936416 },
  "Salzburg → Zell": { lat: 47.8007, lon: 13.0453 },
  "Vienna Airport": { lat: 48.1197, lon: 16.5636 },
};

const pause = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const chunks = (items, size) =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size),
  );

function collectionFor(place) {
  if (place.category === "Food & Restaurants") return "Food";
  if (place.category === "Shopping & Supplies") return "Shopping";
  return "Attractions";
}

function roundedMinutes(seconds) {
  if (seconds == null) return null;
  return Math.max(1, Math.round(seconds / 60));
}

function mergePlaces(places, curation) {
  return [
    ...places
      .filter((place) => !curation.removeIds.includes(place.id))
      .map((place) => ({ ...place, ...(curation.overrides[place.id] ?? {}) })),
    ...curation.additions,
  ];
}

async function requestTable(points, sources, destinations) {
  const coordinates = points.map((point) => `${point.lon},${point.lat}`).join(";");
  const url = new URL(`${routeEndpoint}/${coordinates}`);
  url.searchParams.set("annotations", "duration");
  url.searchParams.set("sources", sources.join(";"));
  url.searchParams.set("destinations", destinations.join(";"));

  const response = await fetch(url, {
    headers: { "user-agent": "AustriaFamilyTrip/1.0 (personal itinerary routing)" },
  });
  if (!response.ok) {
    throw new Error(`OSRM request failed with ${response.status}: ${await response.text()}`);
  }
  const result = await response.json();
  if (result.code !== "Ok") throw new Error(`OSRM returned ${result.code}`);
  await pause(450);
  return result;
}

const [placesJson, curationJson, routingOverrides] = await Promise.all([
  fs.readFile(path.join(dataDirectory, "places.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(dataDirectory, "curation.json"), "utf8").then(JSON.parse),
  fs.readFile(path.join(dataDirectory, "routing-overrides.json"), "utf8").then(JSON.parse),
]);

const places = mergePlaces(placesJson, curationJson).map((place) => ({
  ...place,
  routeLat: routingOverrides[place.id]?.lat ?? place.lat,
  routeLon: routingOverrides[place.id]?.lon ?? place.lon,
}));
const baseEntries = Object.entries(bases);
const basePoints = baseEntries.map(([name, coordinates]) => ({ name, ...coordinates }));
const baseToPlace = Object.fromEntries(baseEntries.map(([name]) => [name, {}]));
const placeToBase = Object.fromEntries(baseEntries.map(([name]) => [name, {}]));
const snapDistanceMeters = {};

for (const placeChunk of chunks(places, 70)) {
  const placePoints = placeChunk.map((place) => ({
    id: place.id,
    lat: place.routeLat,
    lon: place.routeLon,
  }));
  const points = [...basePoints, ...placePoints];
  const baseIndexes = basePoints.map((_, index) => index);
  const placeIndexes = placePoints.map((_, index) => index + basePoints.length);
  const outbound = await requestTable(points, baseIndexes, placeIndexes);
  const inbound = await requestTable(points, placeIndexes, baseIndexes);

  placeChunk.forEach((place, placeIndex) => {
    baseEntries.forEach(([baseName], baseIndex) => {
      baseToPlace[baseName][place.id] = roundedMinutes(outbound.durations[baseIndex][placeIndex]);
      placeToBase[baseName][place.id] = roundedMinutes(inbound.durations[placeIndex][baseIndex]);
    });
    snapDistanceMeters[place.id] = Math.round(outbound.destinations[placeIndex]?.distance ?? 0);
  });
}

const baseMatrix = await requestTable(
  basePoints,
  basePoints.map((_, index) => index),
  basePoints.map((_, index) => index),
);
const baseToBase = Object.fromEntries(
  baseEntries.map(([fromName], fromIndex) => [
    fromName,
    Object.fromEntries(
      baseEntries.map(([toName], toIndex) => [
        toName,
        roundedMinutes(baseMatrix.durations[fromIndex][toIndex]),
      ]),
    ),
  ]),
);

const attractions = places.filter((place) => collectionFor(place) === "Attractions");
if (attractions.length > 95) {
  throw new Error(`Attraction matrix has ${attractions.length} places; split it before routing.`);
}
const attractionPoints = attractions.map((place) => ({
  id: place.id,
  lat: place.routeLat,
  lon: place.routeLon,
}));
const attractionIndexes = attractionPoints.map((_, index) => index);
const attractionMatrix = await requestTable(
  attractionPoints,
  attractionIndexes,
  attractionIndexes,
);
const betweenAttractions = Object.fromEntries(
  attractions.map((fromPlace, fromIndex) => [
    fromPlace.id,
    Object.fromEntries(
      attractions
        .filter((toPlace) => toPlace.id !== fromPlace.id)
        .map((toPlace) => {
          const toIndex = attractions.findIndex((candidate) => candidate.id === toPlace.id);
          return [toPlace.id, roundedMinutes(attractionMatrix.durations[fromIndex][toIndex])];
        }),
    ),
  ]),
);

const result = {
  generatedAt: new Date().toISOString(),
  provider: "OSRM driving routes using OpenStreetMap road data; traffic not included",
  bases,
  baseToPlace,
  placeToBase,
  baseToBase,
  betweenAttractions,
};

await fs.writeFile(
  path.join(dataDirectory, "drive-times.json"),
  `${JSON.stringify(result, null, 2)}\n`,
  "utf8",
);

const warnings = places
  .filter((place) => snapDistanceMeters[place.id] > 300)
  .sort((first, second) => snapDistanceMeters[second.id] - snapDistanceMeters[first.id])
  .map(
    (place) =>
      `${place.id}\t${snapDistanceMeters[place.id]}m\t${place.name}\t${place.routeLat},${place.routeLon}`,
  );

console.log(`Wrote routed times for ${places.length} places and ${attractions.length} attractions.`);
if (warnings.length) {
  console.log("\nPins snapped more than 300 metres to a drivable road:");
  console.log(warnings.join("\n"));
}
