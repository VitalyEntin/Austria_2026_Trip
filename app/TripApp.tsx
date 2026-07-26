"use client";

import {
  Accessibility,
  Baby,
  CalendarDays,
  CarFront,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CloudRain,
  CloudSun,
  Compass,
  Download,
  ExternalLink,
  Eye,
  Gauge,
  House,
  ImageOff,
  Map as MapIcon,
  MapPin,
  Menu,
  MountainSnow,
  Plane,
  Plus,
  RotateCcw,
  Search,
  ShoppingBag,
  Star,
  Store,
  Sun,
  TicketCheck,
  Upload,
  Users,
  Utensils,
  Wind,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import curationJson from "./data/curation.json";
import placeImagesJson from "./data/place-images.json";
import placesJson from "./data/places.json";

type View = "overview" | "today" | "itinerary" | "events" | "explore" | "food" | "shopping" | "map";
type Collection = "Attractions" | "Food" | "Shopping";

type Place = {
  id: string;
  name: string;
  priority: string;
  base: string;
  duration: string;
  weather: string;
  age3: number | string;
  age67: number | string;
  stroller: string;
  august_status: string;
  lat: number;
  lon: number;
  notes: string;
  category: string;
  image?: string;
  official?: string;
  kind?: string;
  location?: string;
  kid_fit?: string;
  route_use?: string;
  google_rating?: number;
  google_review_count?: number;
  price_range?: string;
  rating_checked?: string;
  top_pick?: boolean;
};

type PlacePhotoInfo = {
  src: string;
  label: string;
  detail: string;
  source: string;
};

type DayPlan = {
  date: string;
  label: string;
  base: string;
  people: string;
  plan: string;
  backup: string;
  note: string;
};

type Forecast = {
  date: string;
  min: number;
  max: number;
  rain: number;
  wind: number;
  code: number;
};

type EventItem = {
  date: string;
  time: string;
  title: string;
  place: string;
  note: string;
  kind: "music" | "festival" | "travel" | "swim";
};

type CurationData = {
  removeIds: string[];
  overrides: Record<string, Partial<Place>>;
  additions: Place[];
};

const curation = curationJson as CurationData;
const places = [
  ...(placesJson as Place[])
    .filter((place) => !curation.removeIds.includes(place.id))
    .map((place) => ({ ...place, ...(curation.overrides[place.id] ?? {}) })),
  ...curation.additions,
];
const placeImages = placeImagesJson as Record<string, PlacePhotoInfo>;
const TRIP_START = "2026-08-16";
const TRIP_END = "2026-08-30";

const categoryMeta: Record<string, { short: string; color: string }> = {
  "Trip Bases & Logistics": { short: "Logistics", color: "#5f6d79" },
  "Priority A - Best Family Candidates": { short: "Priority A", color: "#197a5a" },
  "Priority B - Good Alternatives": { short: "Priority B", color: "#2376a8" },
  "Rain & Easy Recovery": { short: "Rain & easy", color: "#d19a24" },
  "Salzburg Transfer Day": { short: "Salzburg", color: "#b9544a" },
  "Longer-Drive Reserves & Verify": { short: "Reserve", color: "#735b8f" },
  "Food & Restaurants": { short: "Food", color: "#c56a24" },
  "Shopping & Supplies": { short: "Shopping", color: "#b44972" },
};

const placeByName = new Map(places.map((place) => [place.name, place]));
const attractionPlaces = places.filter(
  (place) => !["Food & Restaurants", "Shopping & Supplies"].includes(place.category),
);

function collectionFor(place: Place): Collection {
  if (place.category === "Food & Restaurants") return "Food";
  if (place.category === "Shopping & Supplies") return "Shopping";
  return "Attractions";
}

function googleMapsUrl(place: Place) {
  const query = encodeURIComponent(`${place.lat},${place.lon}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

const defaultItinerary: DayPlan[] = [
  {
    date: "2026-08-16",
    label: "Arrival",
    base: "Vienna Airport",
    people: "Family",
    plan: "Vienna Airport overnight area",
    backup: "",
    note: "Land at 18:00, collect the car and keep the evening easy.",
  },
  {
    date: "2026-08-17",
    label: "Drive to Altaussee",
    base: "Altaussee",
    people: "Everyone together",
    plan: "Schloss Ort",
    backup: "Altausseer See",
    note: "Meet the second car, shop for groceries and settle in.",
  },
  {
    date: "2026-08-18",
    label: "Lake day",
    base: "Altaussee",
    people: "Everyone together",
    plan: "Vorderer Gosausee",
    backup: "Altausseer See",
    note: "",
  },
  {
    date: "2026-08-19",
    label: "Clear-weather mountain",
    base: "Altaussee",
    people: "Everyone together",
    plan: "Dachstein Giant Ice Cave",
    backup: "5 Fingers",
    note: "Start with the Ice Cave. Add 5 Fingers only if visibility and everyone's energy are still good. Bring warm layers and the carrier.",
  },
  {
    date: "2026-08-20",
    label: "Hallstatt morning",
    base: "Altaussee",
    people: "Everyone together",
    plan: "Hallstatt village",
    backup: "Obertraun Strandbad / lakeside",
    note: "Village only unless the mine and funicular reopening is confirmed.",
  },
  {
    date: "2026-08-21",
    label: "Wolfgangsee",
    base: "Altaussee",
    people: "Everyone together",
    plan: "Himmelspforte Schafberg",
    backup: "Point 11 - St Wolfgang village",
    note: "Friday family offer after 13:30, subject to official confirmation.",
  },
  {
    date: "2026-08-22",
    label: "Roni turns 3",
    base: "Altaussee",
    people: "Everyone together",
    plan: "Cumberland Wildlife Park Grünau",
    backup: "Altausseer See",
    note: "One attraction, rest, then cake at the house.",
  },
  {
    date: "2026-08-23",
    label: "Yulia turns 40",
    base: "Altaussee",
    people: "Family + friends until departure",
    plan: "Katrin Seilbahn Bad Ischl",
    backup: "Narzissen Vital Resort Bad Aussee",
    note: "Ausseer Baroque Days concert in Bad Aussee at 19:00.",
  },
  {
    date: "2026-08-24",
    label: "Salzburg transfer",
    base: "Salzburg → Zell",
    people: "Family",
    plan: "Hohensalzburg Fortress",
    backup: "Haus der Natur Salzburg",
    note: "Mirabell, old town and one main attraction. Continue to Zell.",
  },
  {
    date: "2026-08-25",
    label: "Easy Zell day",
    base: "Zell am See",
    people: "Family",
    plan: "Schmittenhöhebahn Zell am See",
    backup: "Lake Zell Esplanade and playgrounds",
    note: "",
  },
  {
    date: "2026-08-26",
    label: "High alpine",
    base: "Zell am See",
    people: "Family",
    plan: "Gipfelwelt 3000",
    backup: "Sigmund Thun Gorge and Klammsee",
    note: "Zell SummerNight Festival from 19:00.",
  },
  {
    date: "2026-08-27",
    label: "Gorge day",
    base: "Zell am See",
    people: "Family",
    plan: "Seisenbergklamm",
    backup: "Ritzensee Saalfelden",
    note: "",
  },
  {
    date: "2026-08-28",
    label: "Flexible finale",
    base: "Zell am See",
    people: "Family",
    plan: "Sigmund Thun Gorge and Klammsee",
    backup: "Lake Zell Esplanade and playgrounds",
    note: "Tauern Spa Moonlight Swim from 20:00.",
  },
  {
    date: "2026-08-29",
    label: "Return to Vienna",
    base: "Vienna Airport",
    people: "Family",
    plan: "Vienna Airport overnight area",
    backup: "",
    note: "Leave Zell after breakfast. IRONMAN activity will already be building.",
  },
  {
    date: "2026-08-30",
    label: "Flight home",
    base: "Vienna Airport",
    people: "Family",
    plan: "",
    backup: "",
    note: "10:00 flight. Aim for the terminal around 07:00–07:30.",
  },
];

const events: EventItem[] = [
  {
    date: "2026-08-21",
    time: "19:00",
    title: "Ausseer Baroque Days",
    place: "St Paul Church, Bad Aussee",
    note: "Accademia del Piacere with flamenco singer Alba Carmona.",
    kind: "music",
  },
  {
    date: "2026-08-22",
    time: "19:00",
    title: "Ausseer Baroque Days",
    place: "Altaussee event hall",
    note: "Baroque Alpine sounds. Very close to the first base.",
    kind: "music",
  },
  {
    date: "2026-08-23",
    time: "19:00",
    title: "Ausseer Baroque Days",
    place: "St Paul Church, Bad Aussee",
    note: "A possible special end to Yulia's birthday.",
    kind: "music",
  },
  {
    date: "2026-08-24",
    time: "19:00",
    title: "Zell Summer Concert",
    place: "Ferry Porsche Congress Center",
    note: "Only if the family still has energy after the Salzburg transfer.",
    kind: "music",
  },
  {
    date: "2026-08-26",
    time: "19:00–00:00",
    title: "Zell SummerNight Festival",
    place: "Zell pedestrian zone",
    note: "Music, street performers and food. Runs in all weather.",
    kind: "festival",
  },
  {
    date: "2026-08-28",
    time: "20:00–00:00",
    title: "Moonlight Swim",
    place: "Tauern Spa Kaprun",
    note: "Late swimming in the Skylinepool.",
    kind: "swim",
  },
  {
    date: "2026-08-30",
    time: "Race day",
    title: "IRONMAN 70.3",
    place: "Zell am See–Kaprun",
    note: "You will already be in Vienna; check race-week traffic before leaving Zell on the 29th.",
    kind: "travel",
  },
];

const baseCoordinates: Record<string, { lat: number; lon: number; label: string }> = {
  Altaussee: { lat: 47.661053, lon: 13.742943, label: "Hagan Lodges" },
  "Zell am See": { lat: 47.3045791, lon: 12.7936416, label: "POP-UP LIVING" },
  "Salzburg → Zell": { lat: 47.8007, lon: 13.0453, label: "Salzburg" },
  "Vienna Airport": { lat: 48.1197, lon: 16.5636, label: "Vienna Airport" },
};
const homePlaceIds = new Set(["place-35", "place-36"]);

function isHomePlace(place: Place) {
  return homePlaceIds.has(place.id);
}

function baseForPlace(place: Place) {
  if (place.base.includes("First")) return "Altaussee";
  if (place.base.includes("Second")) return "Zell am See";
  if (/arrival|departure/i.test(place.base)) return "Vienna Airport";
  if (/transfer|salzburg/i.test(place.base)) return "Salzburg → Zell";
  return "Altaussee";
}

function distanceKm(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number },
) {
  const radians = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lon - from.lon);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function approximateDrive(place: Place, baseName = baseForPlace(place)) {
  if (isHomePlace(place)) return "Home";
  const base = baseCoordinates[baseName] ?? baseCoordinates.Altaussee;
  const directDistance = distanceKm(base, place);
  const estimatedRoadKm = directDistance * (directDistance > 90 ? 1.18 : 1.38) + 2;
  const averageSpeed =
    estimatedRoadKm < 12 ? 34 : estimatedRoadKm < 50 ? 47 : estimatedRoadKm < 120 ? 58 : 76;
  const minutes = Math.max(5, Math.round((estimatedRoadKm / averageSpeed) * 12) * 5);
  const source = base.label;
  if (minutes >= 120) {
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return `~${hours}h${remainder ? ` ${remainder}m` : ""} from ${source}`;
  }
  if (minutes >= 60) return `~1h ${minutes - 60}m from ${source}`;
  return `~${minutes} min from ${source}`;
}

function itineraryDrive(day: DayPlan, place?: Place) {
  if (day.date === "2026-08-16") return "~5 min from the airport to the overnight area";
  if (day.date === "2026-08-17") return "~3h 10m total toward Hagan Lodges, plus stops";
  if (day.date === "2026-08-24") return "~55m to Salzburg, then ~1h 15m to POP-UP LIVING";
  if (day.date === "2026-08-29") return "~4h 10m from POP-UP LIVING to Vienna Airport";
  if (day.date === "2026-08-30") return "~5 min from the airport hotel to the terminal";
  return place ? approximateDrive(place, day.base) : "";
}

function itineraryStory(day: DayPlan, place?: Place) {
  if (day.date === "2026-08-16") {
    return "Land at Vienna Airport at 18:00, collect the rental car and make only the short drive to the airport-area hotel. Dinner and sleep are the plan.";
  }
  if (day.date === "2026-08-17") {
    return `Leave the Vienna Airport area after breakfast and drive west toward Altaussee. Stop at ${place?.name || "Gmunden"} for lunch and a walk, then continue to Hagan Lodges, buy groceries and settle in.`;
  }
  if (day.date === "2026-08-24") {
    return `Check out of Hagan Lodges and drive about 55 minutes to Salzburg. Explore the centre and ${place?.name || "one main attraction"}, then continue about 1 hour 15 minutes to POP-UP LIVING in Zell am See.`;
  }
  if (day.date === "2026-08-29") {
    return "Leave POP-UP LIVING after breakfast for the roughly 4 hour 10 minute drive to the Vienna Airport area. Plan one substantial lunch and playground break, then check in and prepare for the morning flight.";
  }
  if (day.date === "2026-08-30") {
    return "Make the short airport transfer early, return the car if needed and aim to be inside the terminal around 07:00-07:30 for the 10:00 flight.";
  }
  if (!place) {
    return "This day has no main outing yet. Choose one attraction and keep the rest of the day flexible.";
  }
  return `Start at ${baseCoordinates[day.base]?.label || day.base}, then drive to ${place.name}. The estimated drive is ${approximateDrive(place, day.base).replace(" from", " each way from")}. Allow ${place.duration.toLowerCase()} for the visit. ${place.notes}`;
}

function isoToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function initialTripDate() {
  const today = isoToday();
  return today >= TRIP_START && today <= TRIP_END ? today : "2026-08-18";
}

function shortDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(`${value}T12:00:00`));
}

function longDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${value}T12:00:00`));
}

function formatReviewCount(value?: number) {
  return value == null ? "Review count unavailable" : `${value.toLocaleString("en-GB")} reviews`;
}

function weatherLabel(code: number) {
  if (code <= 1) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 67) return "Rain";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95) return "Storm";
  return "Mixed";
}

function weatherKind(code: number) {
  if (code <= 1) return "sunny";
  if (code >= 51) return "rain";
  return "cloudy";
}

function WeatherGlyph({ code, size = 24 }: { code: number; size?: number }) {
  if (code <= 1) return <Sun size={size} aria-hidden="true" />;
  if (code >= 51) return <CloudRain size={size} aria-hidden="true" />;
  return <CloudSun size={size} aria-hidden="true" />;
}

function availabilityTone(status: string) {
  const lower = status.toLowerCase();
  if (lower.includes("do not schedule") || lower.includes("unconfirmed")) return "danger";
  if (lower.includes("check") || lower.includes("weather dependent")) return "warn";
  return "good";
}

function photoFor(place: Place): PlacePhotoInfo {
  return (
    placeImages[place.id] ?? {
      src: "",
      label: "Photo unavailable",
      detail: "No verified location image was found",
      source: "",
    }
  );
}

function PlacePhoto({ place }: { place: Place }) {
  const [failed, setFailed] = useState(false);
  const photo = photoFor(place);

  if (!photo.src || failed) {
    return (
      <span className="photo-fallback">
        <ImageOff size={26} />
        <strong>Photo unavailable</strong>
        <small>Open the map for the exact location</small>
      </span>
    );
  }

  return (
    <>
      <img
        src={photo.src}
        alt={`${photo.label} for ${place.name}`}
        onError={() => setFailed(true)}
      />
      <span className="photo-label">{photo.label}</span>
    </>
  );
}

function useLocalStorageState<T>(key: string, fallback: T) {
  const [state, setState] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = window.localStorage.getItem(key);
        if (saved) setState(JSON.parse(saved) as T);
      } catch {
        // Keep the bundled plan if local data is malformed.
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(key, JSON.stringify(state));
  }, [key, ready, state]);

  return [state, setState, ready] as const;
}

function LeafletMap({
  shownPlaces,
  itineraryPlaceIds,
  selected,
  onSelect,
}: {
  shownPlaces: Place[];
  itineraryPlaceIds: Set<string>;
  selected: Place | null;
  onSelect: (place: Place) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const initialBoundsSetRef = useRef(false);

  useEffect(() => {
    let active = true;
    void import("leaflet").then((L) => {
      if (!active || !containerRef.current || mapInstanceRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: false }).setView([47.55, 13.1], 8);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 18,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);
      mapInstanceRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      setTimeout(() => map.invalidateSize(), 0);
    });
    return () => {
      active = false;
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void import("leaflet").then((L) => {
      if (!active || !mapInstanceRef.current || !layerRef.current) return;
      layerRef.current.clearLayers();
      const bounds: [number, number][] = [];
      shownPlaces.forEach((place) => {
        const color = categoryMeta[place.category]?.color ?? "#5f6d79";
        const isSelected = selected?.id === place.id;
        const isHome = isHomePlace(place);
        const isItineraryPlace = itineraryPlaceIds.has(place.id);
        const icon = L.divIcon({
          className: "map-dot-wrap",
          html: isHome
            ? `<span class="map-home-pin${isSelected ? " is-selected" : ""}" aria-hidden="true"><b>⌂</b></span>`
            : `<span class="map-dot${isSelected ? " is-selected" : ""}${isItineraryPlace ? " is-itinerary" : ""}" style="--pin:${color}"></span>`,
          iconSize: isHome ? [34, 34] : [24, 24],
          iconAnchor: isHome ? [17, 30] : [12, 12],
        });
        const marker = L.marker([place.lat, place.lon], { icon })
          .bindTooltip(place.name, { direction: "top", offset: [0, -8] })
          .on("click", () => onSelect(place));
        layerRef.current?.addLayer(marker);
        bounds.push([place.lat, place.lon]);
      });
      if (selected) {
        mapInstanceRef.current.panTo([selected.lat, selected.lon], { animate: true });
      } else if (!initialBoundsSetRef.current && bounds.length > 1) {
        mapInstanceRef.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 10 });
        initialBoundsSetRef.current = true;
      }
    });
    return () => {
      active = false;
    };
  }, [itineraryPlaceIds, onSelect, selected, shownPlaces]);

  return <div ref={containerRef} className="leaflet-map" aria-label="Interactive attraction map" />;
}

export default function TripApp() {
  const [view, setView] = useState<View>("overview");
  const [selectedDate, setSelectedDate] = useState(initialTripDate);
  const [itinerary, setItinerary, itineraryReady] = useLocalStorageState(
    "austria-2026-itinerary",
    defaultItinerary,
  );
  const [visited, setVisited] = useLocalStorageState<string[]>("austria-2026-visited", []);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [baseFilter, setBaseFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("Priority A - Best Family Candidates");
  const [weatherFilter, setWeatherFilter] = useState("All");
  const [collectionFilter, setCollectionFilter] = useState<Collection>("Attractions");
  const [mapCategoryFilter, setMapCategoryFilter] = useState("All");
  const [mapLayers, setMapLayers] = useState({
    Attractions: true,
    Food: false,
    Shopping: false,
  });
  const [itineraryMapOnly, setItineraryMapOnly] = useState(false);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherUpdated, setWeatherUpdated] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const selectedDay = itinerary.find((day) => day.date === selectedDate) ?? itinerary[0];
  const activeBase = baseCoordinates[selectedDay?.base] ?? baseCoordinates.Altaussee;
  const dayIndex = itinerary.findIndex((day) => day.date === selectedDate);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("./sw.js").catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    if (!itineraryReady || !itinerary.some((day) => `${day.label} ${day.note}`.includes("Maya"))) return;
    setItinerary((days) =>
      days.map((day) => ({
        ...day,
        label: day.label.replaceAll("Maya", "Yulia"),
        note: day.note.replaceAll("Maya", "Yulia"),
      })),
    );
  }, [itinerary, itineraryReady, setItinerary]);

  useEffect(() => {
    if (!itineraryReady) return;
    const dachsteinDay = itinerary.find((day) => day.date === "2026-08-19");
    if (dachsteinDay?.plan !== "5 Fingers") return;
    setItinerary((days) =>
      days.map((day) =>
        day.date === "2026-08-19"
          ? {
              ...day,
              plan: "Dachstein Giant Ice Cave",
              backup: "5 Fingers",
              note: "Start with the Ice Cave. Add 5 Fingers only if visibility and everyone's energy are still good. Bring warm layers and the carrier.",
            }
          : day,
      ),
    );
  }, [itinerary, itineraryReady, setItinerary]);

  useEffect(() => {
    let active = true;
    const loadWeather = async () => {
      setWeatherLoading(true);
      try {
        const params = new URLSearchParams({
          latitude: String(activeBase.lat),
          longitude: String(activeBase.lon),
          daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
          timezone: "Europe/Vienna",
          forecast_days: "16",
        });
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!response.ok) throw new Error("Weather unavailable");
        const data = await response.json();
        const index = (data.daily?.time as string[] | undefined)?.indexOf(selectedDate) ?? -1;
        if (!active) return;
        if (index >= 0) {
          setForecast({
            date: selectedDate,
            min: Math.round(data.daily.temperature_2m_min[index]),
            max: Math.round(data.daily.temperature_2m_max[index]),
            rain: Math.round(data.daily.precipitation_probability_max[index] ?? 0),
            wind: Math.round(data.daily.wind_speed_10m_max[index] ?? 0),
            code: data.daily.weather_code[index] ?? 3,
          });
        } else {
          setForecast(null);
        }
        setWeatherUpdated(
          new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
        );
      } catch {
        if (active) setForecast(null);
      } finally {
        if (active) setWeatherLoading(false);
      }
    };
    void loadWeather();
    return () => {
      active = false;
    };
  }, [activeBase.lat, activeBase.lon, selectedDate]);

  const recommendations = useMemo(() => {
    const currentPlan = selectedDay?.plan ? placeByName.get(selectedDay.plan) : undefined;
    const backup = selectedDay?.backup ? placeByName.get(selectedDay.backup) : undefined;
    const baseToken =
      selectedDay?.base === "Altaussee"
        ? "First base"
        : selectedDay?.base === "Zell am See"
          ? "Second base"
          : "Transfer";
    const kind = forecast ? weatherKind(forecast.code) : "unknown";
    const scored = places
      .filter(
        (place) =>
          !place.category.startsWith("Trip") &&
          !["Food & Restaurants", "Shopping & Supplies"].includes(place.category),
      )
      .filter((place) => place.base.includes(baseToken) || place.base.includes("Either"))
      .map((place) => {
        let score = place.priority.startsWith("A") ? 55 : place.priority.startsWith("B") ? 32 : 8;
        const weather = place.weather.toLowerCase();
        if (kind === "rain" && /rain|any|indoor/.test(weather)) score += 35;
        if (kind === "sunny" && /clear|sunny|warm/.test(weather)) score += 28;
        if (kind === "cloudy" && /cloud|dry|any/.test(weather)) score += 20;
        if (visited.includes(place.name)) score -= 60;
        return { place, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.place);
    const picks = [currentPlan, backup, ...scored].filter(Boolean) as Place[];
    return [...new Map(picks.map((place) => [place.name, place])).values()].slice(0, 3);
  }, [forecast, selectedDay, visited]);

  const filteredPlaces = useMemo(() => {
    const term = query.trim().toLowerCase();
    return places.filter((place) => {
      if (
        term &&
        !`${place.name} ${place.notes} ${place.priority} ${place.kind ?? ""} ${place.location ?? ""}`
          .toLowerCase()
          .includes(term)
      )
        return false;
      if (collectionFor(place) !== collectionFilter) return false;
      if (baseFilter !== "All") {
        if (baseFilter === "First base" && !place.base.includes("First")) return false;
        if (baseFilter === "Second base" && !place.base.includes("Second")) return false;
        if (
          baseFilter === "Transfer" &&
          !/(transfer|arrival|departure)/.test(place.base.toLowerCase())
        )
          return false;
      }
      if (collectionFilter === "Attractions") {
        if (categoryFilter !== "All" && place.category !== categoryFilter) return false;
        if (
          weatherFilter !== "All" &&
          !place.weather.toLowerCase().includes(weatherFilter.toLowerCase())
        )
          return false;
      }
      return true;
    });
  }, [baseFilter, categoryFilter, collectionFilter, query, weatherFilter]);

  const itineraryPlaceIds = useMemo(
    () =>
      new Set(
        itinerary
          .map((day) => placeByName.get(day.plan)?.id)
          .filter((id): id is string => Boolean(id)),
      ),
    [itinerary],
  );

  const itineraryDatesByPlaceId = useMemo(() => {
    const datesByPlace = new Map<string, string[]>();
    itinerary.forEach((day) => {
      const placeId = placeByName.get(day.plan)?.id;
      if (!placeId) return;
      const dates = datesByPlace.get(placeId) ?? [];
      dates.push(shortDate(day.date));
      datesByPlace.set(placeId, dates);
    });
    return datesByPlace;
  }, [itinerary]);

  const mapPlaces = useMemo(() => {
    if (itineraryMapOnly) {
      return places.filter(
        (place) => homePlaceIds.has(place.id) || itineraryPlaceIds.has(place.id),
      );
    }
    const term = query.trim().toLowerCase();
    return places.filter((place) => {
      if (isHomePlace(place)) return true;
      if (!mapLayers[collectionFor(place)]) return false;
      if (
        term &&
        !`${place.name} ${place.notes} ${place.priority} ${place.kind ?? ""} ${place.location ?? ""}`
          .toLowerCase()
          .includes(term)
      )
        return false;
      if (
        collectionFor(place) === "Attractions" &&
        mapCategoryFilter !== "All" &&
        place.category !== mapCategoryFilter
      )
        return false;
      return true;
    });
  }, [itineraryMapOnly, itineraryPlaceIds, mapCategoryFilter, mapLayers, query]);

  const eventsToday = events.filter((event) => event.date === selectedDate);
  const selectedPlanPlace = selectedDay?.plan ? placeByName.get(selectedDay.plan) : undefined;
  const selectedDayEvents = events.filter((event) => event.date === selectedDate);
  const selectedDrive = selectedDay ? itineraryDrive(selectedDay, selectedPlanPlace) : "";
  const editingDay = editingDate ? itinerary.find((day) => day.date === editingDate) : undefined;

  function stepDay(direction: number) {
    const next = Math.min(Math.max(dayIndex + direction, 0), itinerary.length - 1);
    setSelectedDate(itinerary[next].date);
  }

  function updateDay(date: string, patch: Partial<DayPlan>) {
    setItinerary((days) => days.map((day) => (day.date === date ? { ...day, ...patch } : day)));
  }

  function resetPersonalPlan() {
    if (!window.confirm("Reset the itinerary and visited places on this device?")) return;
    setItinerary(defaultItinerary);
    setVisited([]);
  }

  function exportPlan() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      itinerary,
      visited,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "austria-2026-personal-plan.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function importPlan(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed.itinerary)) throw new Error("Invalid plan");
      setItinerary(parsed.itinerary);
      if (Array.isArray(parsed.visited)) setVisited(parsed.visited);
    } catch {
      window.alert("That file is not a valid Austria trip plan.");
    }
  }

  function openPlace(place: Place) {
    setSelectedPlace(place);
  }

  function navigateTo(nextView: View, keepSelectedPlace = false) {
    if (!keepSelectedPlace) setSelectedPlace(null);
    setQuery("");
    setBaseFilter("All");
    setWeatherFilter("All");
    setMapCategoryFilter("All");
    if (nextView === "explore") {
      setCollectionFilter("Attractions");
      setCategoryFilter("Priority A - Best Family Candidates");
    } else if (nextView === "food") {
      setCollectionFilter("Food");
      setCategoryFilter("All");
    } else if (nextView === "shopping") {
      setCollectionFilter("Shopping");
      setCategoryFilter("All");
    }
    setView(nextView);
  }

  const navItems: { id: View; label: string; icon: typeof Compass }[] = [
    { id: "overview", label: "Overview", icon: Plane },
    { id: "today", label: "Today", icon: Compass },
    { id: "itinerary", label: "Itinerary", icon: CalendarDays },
    { id: "events", label: "Events", icon: TicketCheck },
    { id: "explore", label: "Explore", icon: Search },
    { id: "food", label: "Food", icon: Utensils },
    { id: "shopping", label: "Shopping", icon: ShoppingBag },
    { id: "map", label: "Map", icon: MapIcon },
  ];
  const mobileNavOrder: View[] = ["overview", "today", "itinerary", "explore", "map"];
  const mobileNavItems = mobileNavOrder
    .map((id) => navItems.find((item) => item.id === id))
    .filter((item): item is (typeof navItems)[number] => Boolean(item));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark"><MountainSnow size={22} /></span>
          <span>
            <strong>Austria 2026</strong>
            <small>Family trip</small>
          </span>
        </div>
        <nav className="desktop-nav" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={view === item.id ? "nav-item active" : "nav-item"}
                onClick={() => navigateTo(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="sidebar-status">
          <span className="status-dot" />
          <span>
            <strong>Saved on this device</strong>
            <small>{itineraryReady ? "Personal plan ready" : "Loading personal plan"}</small>
          </span>
        </div>
      </aside>

      <div className="main-column">
        <header className="topbar">
          <button className="icon-button mobile-only" onClick={() => setMobileMenu(true)} aria-label="Open menu">
            <Menu size={21} />
          </button>
          {view === "overview" || view === "events" ? (
            <button className="trip-window" onClick={() => navigateTo("itinerary")}>
              <CalendarDays size={17} />
              <span>16-30 August 2026</span>
            </button>
          ) : (
            <div className="date-switcher">
              <button className="icon-button" onClick={() => stepDay(-1)} disabled={dayIndex <= 0} aria-label="Previous day">
                <ChevronLeft size={19} />
              </button>
              <button className="date-button" onClick={() => navigateTo("itinerary")}>
                <CalendarDays size={17} />
                <span>{longDate(selectedDate)}</span>
              </button>
              <button
                className="icon-button"
                onClick={() => stepDay(1)}
                disabled={dayIndex >= itinerary.length - 1}
                aria-label="Next day"
              >
                <ChevronRight size={19} />
              </button>
            </div>
          )}
          <div className="topbar-place">
            <MapPin size={16} />
            <span>{view === "overview" || view === "events" ? "Austria" : activeBase.label}</span>
          </div>
        </header>

        <main>
          {view === "today" && (
            <section className="view">
              <div className="page-heading today-heading">
                <div>
                  <span className="eyebrow">{selectedDay?.people}</span>
                  <h1>{selectedDay?.label}</h1>
                  <p>{selectedDay?.note || "A flexible family day in the Alps."}</p>
                </div>
                <button className="secondary-button" onClick={() => setEditingDate(selectedDate)}>
                  <CalendarDays size={17} />
                  Adjust day
                </button>
              </div>

              <div className="weather-band">
                <div className="weather-primary">
                  {forecast ? (
                    <>
                      <span className="weather-glyph"><WeatherGlyph code={forecast.code} size={31} /></span>
                      <div>
                        <strong>{weatherLabel(forecast.code)}</strong>
                        <span>{forecast.min}–{forecast.max}°C in {activeBase.label}</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="weather-glyph"><CloudSun size={31} /></span>
                      <div>
                        <strong>{weatherLoading ? "Checking forecast" : "Forecast not open yet"}</strong>
                        <span>Live detail appears within the 16-day forecast window</span>
                      </div>
                    </>
                  )}
                </div>
                <div className="weather-metrics">
                  <span><CloudRain size={16} /> {forecast ? `${forecast.rain}% rain` : "Rain timing later"}</span>
                  <span><Wind size={16} /> {forecast ? `${forecast.wind} km/h` : "Wind later"}</span>
                  <span><Eye size={16} /> Mountain webcams</span>
                </div>
                <small>Open-Meteo · {weatherUpdated ? `updated ${weatherUpdated}` : "waiting for live data"}</small>
              </div>

              {eventsToday.length > 0 && (
                <div className="event-strip">
                  <TicketCheck size={20} />
                  <div>
                    <strong>{eventsToday[0].title} · {eventsToday[0].time}</strong>
                    <span>{eventsToday[0].place} — {eventsToday[0].note}</span>
                  </div>
                </div>
              )}

              <div className="section-heading">
                <div>
                  <span className="eyebrow">One main outing</span>
                  <h2>Current plan and alternatives</h2>
                  <p className="section-note">The selected card is the day plan. The other cards are backups, not extra required stops.</p>
                </div>
                <span className="quiet-label">{forecast ? "Weather ranked" : "Itinerary ranked"}</span>
              </div>

              <div className="recommendation-grid">
                {recommendations.map((place, index) => {
                  const isCurrentPlan = selectedDay?.plan === place.name;
                  return (
                    <article className={isCurrentPlan ? "recommendation-card current-plan" : "recommendation-card"} key={place.id}>
                      <button className="card-click" onClick={() => openPlace(place)} aria-label={`View ${place.name}`}>
                        <div className="card-media">
                          <PlacePhoto key={place.id} place={place} />
                          <span className="rank-chip">
                            {isCurrentPlan ? "Current plan" : index === 0 ? "Best match" : index === 1 ? "Easier option" : "Alternative"}
                          </span>
                        </div>
                        <div className="card-body">
                          <div className="card-title-row">
                            <div>
                              <span className="category-label">{categoryMeta[place.category]?.short}</span>
                              <h3>{place.name}</h3>
                            </div>
                            <ChevronRight size={20} />
                          </div>
                          <p>{place.notes}</p>
                          <div className="facts-row">
                            <span><CarFront size={15} /> {approximateDrive(place, selectedDay?.base)}</span>
                            <span><Gauge size={15} /> {place.duration}</span>
                            <span><Baby size={15} /> Age 3: {place.age3}/5</span>
                            <span><Accessibility size={15} /> {place.stroller}</span>
                          </div>
                        </div>
                      </button>
                      <div className="card-actions">
                        <button
                          className="primary-button compact"
                          onClick={() => updateDay(selectedDate, { plan: place.name })}
                          disabled={isCurrentPlan}
                        >
                          <Check size={16} />
                          {isCurrentPlan ? "Selected" : "Choose as main"}
                        </button>
                        <a
                          className="icon-button"
                          href={googleMapsUrl(place)}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`Open ${place.name} in Google Maps`}
                          title="Open in Google Maps"
                        >
                          <MapPin size={18} />
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="today-lower-grid">
                <section className="plain-section">
                  <div className="section-heading compact-heading">
                    <div>
                      <span className="eyebrow">Timing</span>
                      <h2>Today’s checks</h2>
                    </div>
                  </div>
                  <div className="check-list">
                    {(recommendations.slice(0, 2)).map((place) => (
                      <button className="check-row" key={place.id} onClick={() => openPlace(place)}>
                        <span className={`availability-dot ${availabilityTone(place.august_status)}`} />
                        <span>
                          <strong>{place.name}</strong>
                          <small>{place.august_status}</small>
                        </span>
                        <ChevronRight size={18} />
                      </button>
                    ))}
                  </div>
                </section>
                <section className="plain-section">
                  <div className="section-heading compact-heading">
                    <div>
                      <span className="eyebrow">Progress</span>
                      <h2>Trip at a glance</h2>
                    </div>
                  </div>
                  <div className="trip-stats">
                    <span><strong>{visited.length}</strong><small>places visited</small></span>
                    <span><strong>{events.filter((event) => event.date >= selectedDate).length}</strong><small>events ahead</small></span>
                    <span><strong>{itinerary.filter((day) => day.plan).length}</strong><small>days with a main plan</small></span>
                  </div>
                </section>
              </div>
            </section>
          )}

          {view === "events" && (
            <section className="view">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">Time-sensitive plans</span>
                  <h1>Events</h1>
                  <p>Concerts, festivals and dated activities during the trip.</p>
                </div>
              </div>
              <div className="events-page">
                {events.map((event) => (
                  <button
                    className="event-row event-page-row"
                    key={`${event.date}-${event.title}`}
                    onClick={() => {
                      setSelectedDate(event.date);
                      navigateTo("today");
                    }}
                  >
                    <span className={`event-icon ${event.kind}`}><TicketCheck size={18} /></span>
                    <span className="event-date">
                      <strong>{new Date(`${event.date}T12:00:00`).getDate()}</strong>
                      <small>Aug</small>
                    </span>
                    <span>
                      <strong>{event.title}</strong>
                      <small>{event.time} · {event.place}</small>
                      <p>{event.note}</p>
                    </span>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {view === "itinerary" && (
            <section className="view">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">16–30 August</span>
                  <h1>Itinerary</h1>
                  <p>{itinerary.filter((day) => day.plan).length} days with one main outing · changes stay on this device</p>
                </div>
                <button className="secondary-button" onClick={() => setEditingDate(selectedDate)}>
                  <Plus size={17} />
                  Edit selected day
                </button>
              </div>
              <div className="itinerary-layout">
                <div className="itinerary-list">
                  {itinerary.map((day) => {
                    const plan = placeByName.get(day.plan);
                    const dayDrive = itineraryDrive(day, plan);
                    const dayEvents = events.filter((event) => event.date === day.date);
                    const active = day.date === selectedDate;
                    return (
                      <article
                        className={active ? "day-row active" : "day-row"}
                        key={day.date}
                        onClick={() => setSelectedDate(day.date)}
                      >
                        <div className="day-date">
                          <strong>{new Date(`${day.date}T12:00:00`).getDate()}</strong>
                          <span>Aug</span>
                        </div>
                        <div className="day-main">
                          <div className="day-meta">
                            <span>{shortDate(day.date).split(",")[0]}</span>
                            <span>{day.base}</span>
                            <span><Users size={13} /> {day.people}</span>
                          </div>
                          <h3>{day.label}</h3>
                          <button
                            className="day-plan-link"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (plan) openPlace(plan);
                            }}
                          >
                            {plan ? `Main: ${plan.name}` : "No main outing planned"}
                            {plan && <ChevronRight size={16} />}
                          </button>
                          {dayDrive && <small><CarFront size={12} /> {dayDrive}</small>}
                          {day.backup && <small>Weather backup: {day.backup}</small>}
                          {day.note && <p>{day.note}</p>}
                          {active && <p className="mobile-day-story">{itineraryStory(day, plan)}</p>}
                          {dayEvents.map((event) => (
                            <span className="event-pill" key={event.title}>
                              <TicketCheck size={13} /> {event.time} · {event.title}
                            </span>
                          ))}
                        </div>
                        <button
                          className="icon-button edit-day"
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditingDate(day.date);
                          }}
                          aria-label={`Edit ${shortDate(day.date)}`}
                        >
                          <CalendarDays size={18} />
                        </button>
                      </article>
                    );
                  })}
                </div>
                <aside className="itinerary-side">
                  <span className="eyebrow">How this day looks</span>
                  <h2>{longDate(selectedDate)}</h2>
                  <h3>{selectedDay?.label}</h3>
                  {selectedDay ? (
                    <>
                      <p className="day-story">{itineraryStory(selectedDay, selectedPlanPlace)}</p>
                      {selectedPlanPlace && (
                        <div className="day-story-facts">
                          <span><CarFront size={15} /><strong>{selectedDrive}</strong><small>Approximate driving</small></span>
                          <span><Gauge size={15} /><strong>{selectedPlanPlace.duration}</strong><small>Visit length</small></span>
                          <span><CloudSun size={15} /><strong>{selectedPlanPlace.weather}</strong><small>Best conditions</small></span>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="day-story">This day has no main outing yet. Choose one attraction and keep the rest of the day flexible.</p>
                  )}
                  {selectedDay?.note && <p>{selectedDay.note}</p>}
                  {selectedPlanPlace && (
                    <button className="mini-place" onClick={() => openPlace(selectedPlanPlace)}>
                      <MapPin size={18} />
                      <span>
                        <strong>{selectedPlanPlace.name}</strong>
                        <small>Open full place details</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  )}
                  {selectedDay?.backup && (
                    <div className="day-backup">
                      <strong>Weather backup</strong>
                      <span>{selectedDay.backup}</span>
                    </div>
                  )}
                  {selectedDayEvents.map((event) => (
                    <div className="day-event" key={`${event.date}-${event.title}`}>
                      <TicketCheck size={15} />
                      <span><strong>{event.time} · {event.title}</strong><small>{event.place}</small></span>
                    </div>
                  ))}
                  <button className="primary-button wide" onClick={() => setEditingDate(selectedDate)}>
                    Adjust this day
                  </button>
                </aside>
              </div>
            </section>
          )}

          {(["explore", "food", "shopping"] as View[]).includes(view) && (
            <section className="view">
              <div className="page-heading">
                <div>
                  <span className="eyebrow">
                    {collectionFilter === "Attractions"
                      ? `${attractionPlaces.length} curated attractions`
                      : collectionFilter === "Food"
                        ? `${places.filter((place) => collectionFor(place) === "Food").length} researched restaurants`
                        : `${places.filter((place) => collectionFor(place) === "Shopping").length} useful shops`}
                  </span>
                  <h1>
                    {collectionFilter === "Attractions"
                      ? "Explore"
                      : collectionFilter === "Food"
                        ? "Food"
                        : "Shopping"}
                  </h1>
                  <p>
                    {collectionFilter === "Attractions"
                      ? `${filteredPlaces.length} attractions match. Priority A is selected by default.`
                      : collectionFilter === "Food"
                        ? `${filteredPlaces.length} restaurants with cuisine, price and Google review detail.`
                        : `${filteredPlaces.length} supermarkets, local producers and special shops.`}
                  </p>
                </div>
              </div>
              <div className="filter-bar">
                <label className="search-field">
                  <Search size={18} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      collectionFilter === "Food"
                        ? "Search restaurants or towns"
                        : collectionFilter === "Shopping"
                          ? "Search shops or supplies"
                          : "Search attractions"
                    }
                  />
                </label>
                <label>
                  <span className="sr-only">Base</span>
                  <select value={baseFilter} onChange={(e) => setBaseFilter(e.target.value)}>
                    <option>All</option>
                    <option>First base</option>
                    <option>Second base</option>
                    <option>Transfer</option>
                  </select>
                </label>
                {collectionFilter === "Attractions" ? (
                  <>
                    <label>
                      <span className="sr-only">Category</span>
                      <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                        <option>All</option>
                        {Object.keys(categoryMeta)
                          .filter(
                            (category) =>
                              !["Food & Restaurants", "Shopping & Supplies"].includes(category),
                          )
                          .map((category) => (
                            <option value={category} key={category}>{categoryMeta[category].short}</option>
                          ))}
                      </select>
                    </label>
                    <label>
                      <span className="sr-only">Weather</span>
                      <select value={weatherFilter} onChange={(e) => setWeatherFilter(e.target.value)}>
                        <option>All</option>
                        <option>Clear</option>
                        <option>Cloudy</option>
                        <option>Rain</option>
                        <option>Any</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <div className="collection-hint">
                    {collectionFilter === "Food" ? <Utensils size={17} /> : <ShoppingBag size={17} />}
                    <span>
                      {collectionFilter === "Food"
                        ? "Gold stars mark restaurants worth planning into the itinerary"
                        : "Gold stars mark distinctive shops worth making time for"}
                    </span>
                  </div>
                )}
                <button
                  className="icon-button"
                  onClick={() => {
                    setQuery("");
                    setBaseFilter("All");
                    setCategoryFilter(
                      collectionFilter === "Attractions"
                        ? "Priority A - Best Family Candidates"
                        : "All",
                    );
                    setWeatherFilter("All");
                  }}
                  aria-label="Clear filters"
                  title="Clear filters"
                >
                  <X size={18} />
                </button>
              </div>
              <div className={`place-table-head ${collectionFilter.toLowerCase()}-columns`}>
                <span>{collectionFilter === "Food" ? "Restaurant" : collectionFilter === "Shopping" ? "Shop" : "Place"}</span>
                <span>{collectionFilter === "Attractions" ? "Best base" : "Area"}</span>
                <span>{collectionFilter === "Attractions" ? "Visit / drive" : "Type"}</span>
                <span>{collectionFilter === "Attractions" ? "Weather" : collectionFilter === "Food" ? "Price" : "Best use"}</span>
                <span>{collectionFilter === "Attractions" ? "Status" : collectionFilter === "Food" ? "Google rating" : "Priority"}</span>
              </div>
              <div className="place-list">
                {filteredPlaces.map((place) => (
                  <button
                    className={`place-row ${collectionFilter.toLowerCase()}-columns${
                      itineraryPlaceIds.has(place.id) ? " is-itinerary-place" : ""
                    }`}
                    key={place.id}
                    onClick={() => openPlace(place)}
                  >
                    <span className="place-name-cell">
                      <span
                        className="category-swatch"
                        style={{ background: categoryMeta[place.category]?.color }}
                      />
                      <span>
                        <strong>{place.name}</strong>
                        <small>
                          {place.top_pick && <Star className="top-pick-star" size={13} fill="currentColor" />}
                          {place.top_pick ? "Plan for this" : place.priority}
                        </small>
                        {collectionFilter === "Attractions" && itineraryDatesByPlaceId.has(place.id) && (
                          <span className="itinerary-selection-badge">
                            <CalendarDays size={12} />
                            In itinerary · {itineraryDatesByPlaceId.get(place.id)?.join(", ")}
                          </span>
                        )}
                        {collectionFilter === "Food" && (
                          <span className="mobile-food-meta">
                            {place.kind} · {place.price_range || "Price not listed"}
                          </span>
                        )}
                        <span className="mobile-drive-meta"><CarFront size={11} /> {approximateDrive(place)}</span>
                      </span>
                    </span>
                    <span className="area-cell">
                      {collectionFilter === "Attractions" ? place.base : place.location}
                      {collectionFilter !== "Attractions" && <small><CarFront size={11} /> {approximateDrive(place)}</small>}
                    </span>
                    <span>
                      {collectionFilter === "Attractions" ? (
                        <span className="drive-cell">
                          <strong>{place.duration}</strong>
                          <small><CarFront size={11} /> {approximateDrive(place)}</small>
                        </span>
                      ) : (
                        place.kind
                      )}
                    </span>
                    <span>
                      {collectionFilter === "Attractions"
                        ? place.weather
                        : collectionFilter === "Food"
                          ? place.price_range || "Price not listed"
                          : place.route_use}
                    </span>
                    {collectionFilter === "Attractions" ? (
                      <span className={`status-label ${availabilityTone(place.august_status)}`}>
                        {availabilityTone(place.august_status) === "good"
                          ? "Open"
                          : availabilityTone(place.august_status) === "danger"
                            ? "Unconfirmed"
                            : "Verify"}
                      </span>
                    ) : collectionFilter === "Food" ? (
                      <span className="google-rating">
                        <Star size={15} fill="currentColor" />
                        <strong>{place.google_rating?.toFixed(1) ?? "N/A"}</strong>
                        <small>{formatReviewCount(place.google_review_count)}</small>
                      </span>
                    ) : (
                      <span className={place.top_pick ? "shop-priority top" : "shop-priority"}>
                        {place.top_pick ? "Plan a visit" : "Useful stop"}
                      </span>
                    )}
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            </section>
          )}

          {view === "map" && (
            <section className="map-view">
              <div className="map-toolbar">
                <div>
                  <span className="eyebrow">{mapPlaces.length} visible pins</span>
                  <h1>Map</h1>
                </div>
                <label className="search-field compact-search">
                  <Search size={17} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a place" />
                </label>
                <select
                  value={mapCategoryFilter}
                  onChange={(e) => setMapCategoryFilter(e.target.value)}
                  aria-label="Filter map by attraction category"
                >
                  <option value="All">All categories</option>
                  <option value="Priority A - Best Family Candidates">Priority A</option>
                  <option value="Priority B - Good Alternatives">Priority B</option>
                  <option value="Rain & Easy Recovery">Bad weather & easy</option>
                  <option value="Salzburg Transfer Day">Salzburg</option>
                  <option value="Longer-Drive Reserves & Verify">Reserves</option>
                </select>
                <div className="map-layer-controls" aria-label="Map layers">
                  {([
                    { id: "Attractions" as Collection, icon: MapPin },
                    { id: "Food" as Collection, icon: Utensils },
                    { id: "Shopping" as Collection, icon: ShoppingBag },
                  ]).map((layer) => {
                    const Icon = layer.icon;
                    const active = !itineraryMapOnly && mapLayers[layer.id];
                    return (
                      <button
                        key={layer.id}
                        className={`map-layer ${layer.id.toLowerCase()}${active ? " active" : ""}`}
                        aria-pressed={active}
                        onClick={() => {
                          const wasItineraryOnly = itineraryMapOnly;
                          setItineraryMapOnly(false);
                          setMapLayers((current) => ({
                            ...current,
                            [layer.id]: wasItineraryOnly ? true : !current[layer.id],
                          }));
                        }}
                      >
                        <Icon size={15} />
                        <span>{layer.id}</span>
                        <span className="layer-state" aria-hidden="true">
                          <span className="layer-switch" />
                          <b>{active ? "ON" : "OFF"}</b>
                        </span>
                      </button>
                    );
                  })}
                  <button
                    className={`map-layer itinerary${itineraryMapOnly ? " active" : ""}`}
                    aria-pressed={itineraryMapOnly}
                    onClick={() => setItineraryMapOnly((current) => !current)}
                  >
                    <CalendarDays size={15} />
                    <span>Itinerary + homes</span>
                    <span className="layer-state" aria-hidden="true">
                      <span className="layer-switch" />
                      <b>{itineraryMapOnly ? "ON" : "OFF"}</b>
                    </span>
                  </button>
                  <span className="map-home-legend"><House size={15} /> Homes always shown</span>
                </div>
              </div>
              <div className="map-stage">
                <LeafletMap
                  shownPlaces={mapPlaces}
                  itineraryPlaceIds={itineraryPlaceIds}
                  selected={selectedPlace}
                  onSelect={setSelectedPlace}
                />
                {selectedPlace && (
                  <aside className="map-preview">
                    <button className="icon-button close-preview" onClick={() => setSelectedPlace(null)} aria-label="Close place preview">
                      <X size={18} />
                    </button>
                    <span className="category-label">
                      {isHomePlace(selectedPlace) ? "Home" : categoryMeta[selectedPlace.category]?.short}
                    </span>
                    <h2>{selectedPlace.name}</h2>
                    <p>{selectedPlace.notes}</p>
                    <div className="facts-stack">
                      <span><CarFront size={15} /> {approximateDrive(selectedPlace)}</span>
                      <span><Gauge size={15} /> {selectedPlace.route_use || selectedPlace.duration}</span>
                      <span>
                        {collectionFor(selectedPlace) === "Food" ? (
                          <Utensils size={15} />
                        ) : collectionFor(selectedPlace) === "Shopping" ? (
                          <Store size={15} />
                        ) : (
                          <CloudSun size={15} />
                        )}
                        {selectedPlace.kind || selectedPlace.weather}
                      </span>
                      <span><MapPin size={15} /> {selectedPlace.location || selectedPlace.base}</span>
                      {collectionFor(selectedPlace) === "Food" && (
                        <span>
                          <Star size={15} fill="currentColor" />
                          {selectedPlace.google_rating?.toFixed(1) ?? "N/A"} Google · {selectedPlace.price_range || "price not listed"}
                        </span>
                      )}
                    </div>
                    <div className="map-preview-actions">
                      <button
                        className="primary-button"
                        onClick={() =>
                          navigateTo(
                            collectionFor(selectedPlace) === "Food"
                              ? "food"
                              : collectionFor(selectedPlace) === "Shopping"
                                ? "shopping"
                                : "explore",
                            true,
                          )
                        }
                      >
                        Full details
                      </button>
                      <a
                        className="secondary-button"
                        href={googleMapsUrl(selectedPlace)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Open ${selectedPlace.name} in Google Maps`}
                      >
                        <MapPin size={17} />
                        Google Maps
                      </a>
                    </div>
                  </aside>
                )}
              </div>
            </section>
          )}

          {view === "overview" && (
            <section className="view">
              <div className="page-heading overview-heading">
                <div>
                  <span className="eyebrow">16-30 August 2026</span>
                  <h1>Austria family trip</h1>
                  <p>Two nature bases, a Salzburg transfer day and flexible plans for changing mountain weather.</p>
                </div>
              </div>
              <div className="overview-band">
                <span><Users size={18} /><strong>Family</strong><small>You and Yulia, Roni (3) and your six-year-old</small></span>
                <span><Users size={18} /><strong>Friends</strong><small>One adult and child (7), 17-23 Aug</small></span>
                <span><CalendarDays size={18} /><strong>Daily rhythm</strong><small>One main outing plus a weather backup</small></span>
              </div>
              <div className="trip-grid">
                <section className="trip-section overview-route-section">
                  <div className="section-heading compact-heading">
                    <div>
                      <span className="eyebrow">The whole journey</span>
                      <h2>Trip overview</h2>
                    </div>
                    <button className="text-button" onClick={() => navigateTo("itinerary")}>
                      Open itinerary <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="overview-route">
                    <div className="route-stop airport">
                      <span><Plane size={19} /></span>
                      <div><small>16 Aug · arrive 18:00</small><strong>Vienna Airport</strong><p>Airport-area overnight after landing.</p></div>
                    </div>
                    <div className="route-drive"><CarFront size={14} /><span>About 3h 10m on 17 Aug</span></div>
                    <div className="route-stop home">
                      <span><House size={20} /></span>
                      <div><small>17-24 Aug · first home</small><strong>Hagan Lodges - Lodges Sandling</strong><p>Exact pin: 47.661053, 13.742943</p></div>
                    </div>
                    <div className="route-drive"><CarFront size={14} /><span>Via Salzburg on 24 Aug · about 55m + 1h 15m</span></div>
                    <div className="route-stop home">
                      <span><House size={20} /></span>
                      <div><small>24-29 Aug · second home</small><strong>POP-UP LIVING Zell am See</strong><p>Karl-Flieher-Straße 1, 5700 Zell am See</p></div>
                    </div>
                    <div className="route-drive"><CarFront size={14} /><span>About 4h 10m on 29 Aug</span></div>
                    <div className="route-stop airport">
                      <span><Plane size={19} /></span>
                      <div><small>30 Aug · depart 10:00</small><strong>Vienna Airport</strong><p>Final airport-area overnight on 29 Aug.</p></div>
                    </div>
                  </div>
                </section>

                <section className="trip-section overview-actions-section">
                  <div className="section-heading compact-heading">
                    <div>
                      <span className="eyebrow">Start here</span>
                      <h2>Choose what you need</h2>
                    </div>
                  </div>
                  <div className="overview-actions">
                    <button onClick={() => navigateTo("today")}><Compass size={18} /><span><strong>Decide a day</strong><small>Weather and current plan</small></span><ChevronRight size={17} /></button>
                    <button onClick={() => navigateTo("events")}><TicketCheck size={18} /><span><strong>See events</strong><small>Concerts and dated activities</small></span><ChevronRight size={17} /></button>
                    <button onClick={() => navigateTo("explore")}><Search size={18} /><span><strong>Browse attractions</strong><small>Starts with Priority A</small></span><ChevronRight size={17} /></button>
                    <button onClick={() => navigateTo("food")}><Utensils size={18} /><span><strong>Find food</strong><small>Cuisine, price and Google ratings</small></span><ChevronRight size={17} /></button>
                    <button onClick={() => navigateTo("shopping")}><ShoppingBag size={18} /><span><strong>Find shops</strong><small>Groceries and special local stops</small></span><ChevronRight size={17} /></button>
                  </div>
                </section>

                <section className="trip-section device-section">
                  <div className="section-heading compact-heading">
                    <div>
                      <span className="eyebrow">This phone</span>
                      <h2>Personal plan</h2>
                    </div>
                  </div>
                  <div className="device-actions">
                    <button className="secondary-button" onClick={exportPlan}>
                      <Download size={17} /> Export
                    </button>
                    <button className="secondary-button" onClick={() => importRef.current?.click()}>
                      <Upload size={17} /> Import
                    </button>
                    <button className="text-button danger-text" onClick={resetPersonalPlan}>
                      <RotateCcw size={16} /> Reset this device
                    </button>
                    <input
                      ref={importRef}
                      className="sr-only"
                      type="file"
                      accept="application/json"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void importPlan(file);
                        event.target.value = "";
                      }}
                    />
                  </div>
                </section>
              </div>
            </section>
          )}
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Main navigation">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              className={view === item.id ? "active" : ""}
              onClick={() => navigateTo(item.id)}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {mobileMenu && (
        <div className="mobile-menu-backdrop" onClick={() => setMobileMenu(false)}>
          <aside className="mobile-menu-sheet" onClick={(event) => event.stopPropagation()}>
            <div className="brand">
              <span className="brand-mark"><MountainSnow size={22} /></span>
              <span><strong>Austria 2026</strong><small>Family trip</small></span>
              <button className="icon-button" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={19} /></button>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={view === item.id ? "nav-item active" : "nav-item"}
                  onClick={() => {
                    navigateTo(item.id);
                    setMobileMenu(false);
                  }}
                >
                  <Icon size={19} /> {item.label}
                </button>
              );
            })}
          </aside>
        </div>
      )}

      {selectedPlace && view !== "map" && (
        <div className="drawer-backdrop" onClick={() => setSelectedPlace(null)}>
          <aside className="place-drawer" onClick={(event) => event.stopPropagation()}>
            <button className="icon-button drawer-close" onClick={() => setSelectedPlace(null)} aria-label="Close details">
              <X size={20} />
            </button>
            {(collectionFor(selectedPlace) === "Attractions" || photoFor(selectedPlace).src) && (
              <div className="drawer-media">
                <PlacePhoto key={selectedPlace.id} place={selectedPlace} />
              </div>
            )}
            <div className="drawer-content">
              <div className="drawer-kicker">
                <span className="category-label">{categoryMeta[selectedPlace.category]?.short}</span>
                {selectedPlace.top_pick && (
                  <span className="top-pick-badge"><Star size={13} fill="currentColor" /> Plan for this</span>
                )}
                {photoFor(selectedPlace).source && (
                  <a href={photoFor(selectedPlace).source} target="_blank" rel="noreferrer">
                    Visual source <ExternalLink size={12} />
                  </a>
                )}
              </div>
              <h2>{selectedPlace.name}</h2>
              <p className="drawer-lead">{selectedPlace.notes}</p>
              <div className={`availability-box ${availabilityTone(selectedPlace.august_status)}`}>
                {availabilityTone(selectedPlace.august_status) === "danger" ? <CircleAlert size={19} /> : <TicketCheck size={19} />}
                <span><strong>17–29 August</strong>{selectedPlace.august_status}</span>
              </div>
              <div className="detail-grid">
                <span><CarFront size={17} /><small>Approximate drive</small><strong>{approximateDrive(selectedPlace)}</strong></span>
                {collectionFor(selectedPlace) === "Attractions" ? (
                  <>
                    <span><Gauge size={17} /><small>Visit length</small><strong>{selectedPlace.duration}</strong></span>
                    <span><CloudSun size={17} /><small>Best weather</small><strong>{selectedPlace.weather}</strong></span>
                    <span><Baby size={17} /><small>Age 3</small><strong>{selectedPlace.age3}/5</strong></span>
                    <span><Users size={17} /><small>Age 6–7</small><strong>{selectedPlace.age67}/5</strong></span>
                    <span><Accessibility size={17} /><small>Stroller</small><strong>{selectedPlace.stroller}</strong></span>
                    <span><MapPin size={17} /><small>Best base</small><strong>{selectedPlace.base}</strong></span>
                  </>
                ) : collectionFor(selectedPlace) === "Food" ? (
                  <>
                    <span>
                      <Utensils size={17} />
                      <small>Cuisine</small><strong>{selectedPlace.kind}</strong>
                    </span>
                    <span><Gauge size={17} /><small>Price</small><strong>{selectedPlace.price_range || "Not listed"}</strong></span>
                    <span>
                      <Star size={17} fill="currentColor" />
                      <small>Google rating</small>
                      <strong>{selectedPlace.google_rating?.toFixed(1) ?? "N/A"} · {formatReviewCount(selectedPlace.google_review_count)}</strong>
                    </span>
                    <span><MapPin size={17} /><small>Area</small><strong>{selectedPlace.location}</strong></span>
                    <span><Gauge size={17} /><small>Best use</small><strong>{selectedPlace.route_use}</strong></span>
                    <span><Users size={17} /><small>Family fit</small><strong>{selectedPlace.kid_fit}</strong></span>
                    <span><TicketCheck size={17} /><small>Rating checked</small><strong>{selectedPlace.rating_checked || "Not recorded"}</strong></span>
                  </>
                ) : (
                  <>
                    <span><Store size={17} /><small>Shop type</small><strong>{selectedPlace.kind}</strong></span>
                    <span><MapPin size={17} /><small>Area</small><strong>{selectedPlace.location}</strong></span>
                    <span><Gauge size={17} /><small>Best use</small><strong>{selectedPlace.route_use}</strong></span>
                    <span><Users size={17} /><small>Family fit</small><strong>{selectedPlace.kid_fit}</strong></span>
                    <span>
                      <Star size={17} fill={selectedPlace.top_pick ? "currentColor" : "none"} />
                      <small>Recommendation</small>
                      <strong>{selectedPlace.top_pick ? "Plan a visit" : "Useful if nearby"}</strong>
                    </span>
                  </>
                )}
              </div>
              <div className="drawer-actions">
                {collectionFor(selectedPlace) === "Attractions" && (
                  <button
                    className="primary-button"
                    onClick={() => {
                      updateDay(selectedDate, { plan: selectedPlace.name });
                      setSelectedPlace(null);
                    }}
                  >
                    <CalendarDays size={17} /> Add to {shortDate(selectedDate)}
                  </button>
                )}
                <a
                  className="secondary-button"
                  href={googleMapsUrl(selectedPlace)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${selectedPlace.name} in Google Maps`}
                >
                  <MapPin size={17} /> Google Maps
                </a>
                {selectedPlace.official && (
                  <a
                    className="secondary-button"
                    href={selectedPlace.official}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={17} /> Official site
                  </a>
                )}
                <button
                  className={visited.includes(selectedPlace.name) ? "text-button visited-button" : "text-button"}
                  onClick={() =>
                    setVisited((items) =>
                      items.includes(selectedPlace.name)
                        ? items.filter((name) => name !== selectedPlace.name)
                        : [...items, selectedPlace.name],
                    )
                  }
                >
                  <Check size={16} />
                  {visited.includes(selectedPlace.name) ? "Visited" : "Mark visited"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {editingDay && (
        <div className="modal-backdrop" onClick={() => setEditingDate(null)}>
          <div className="edit-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <span className="eyebrow">{shortDate(editingDay.date)}</span>
                <h2>{editingDay.label}</h2>
              </div>
              <button className="icon-button" onClick={() => setEditingDate(null)} aria-label="Close editor"><X size={19} /></button>
            </div>
            <label className="field">
              <span>Main outing</span>
              <select value={editingDay.plan} onChange={(e) => updateDay(editingDay.date, { plan: e.target.value })}>
                <option value="">No main outing planned</option>
                {attractionPlaces.map((place) => <option value={place.name} key={place.id}>{place.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Weather backup</span>
              <select value={editingDay.backup} onChange={(e) => updateDay(editingDay.date, { backup: e.target.value })}>
                <option value="">No backup</option>
                {attractionPlaces.map((place) => <option value={place.name} key={place.id}>{place.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>Day note</span>
              <textarea value={editingDay.note} onChange={(e) => updateDay(editingDay.date, { note: e.target.value })} rows={3} />
            </label>
            <div className="modal-actions">
              <button className="primary-button" onClick={() => setEditingDate(null)}><Check size={17} /> Done</button>
              <button
                className="text-button"
                onClick={() => {
                  const original = defaultItinerary.find((day) => day.date === editingDay.date);
                  if (original) updateDay(editingDay.date, original);
                }}
              >
                <RotateCcw size={16} /> Reset day
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
