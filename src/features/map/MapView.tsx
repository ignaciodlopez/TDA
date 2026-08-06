import { useEffect, useRef } from 'react';
import {
  LngLatBounds,
  Map as MapLibreMap,
  NavigationControl,
  setWorkerUrl,
  type ExpressionSpecification,
  type GeoJSONSource,
  type MapGeoJSONFeature,
  type MapLayerMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { StationFeatureCollection } from '@/lib/geo/geojson';

// El worker de MapLibre importa internamente un chunk propio (maplibre-gl-shared.mjs) mediante
// una ruta relativa. Si Vite reempaqueta o renombra esos archivos (p. ej. vía `?url`), esa
// referencia relativa se rompe y el worker nunca carga: el mapa se queda sin estilo ni
// marcadores, sin ningún error visible más que un 404 de red. Por eso se sirven tal cual desde
// public/maplibre-gl/ (copiados en cada `npm install`, ver scripts/copy-maplibre-worker.mjs) en
// vez de dejar que el bundler los procese.
setWorkerUrl('/maplibre-gl/maplibre-gl-worker.mjs');

const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// El estilo base de OpenFreeMap etiqueta los lugares en inglés por defecto (`name_en`), lo que
// muestra p. ej. "Falkland Islands" en vez de "Islas Malvinas". Se parchea la expresión de todas
// las capas de texto para preferir el nombre en español (`name_es`, presente en los datos de
// OpenStreetMap) antes que el inglés. Si el fetch falla, se usa el estilo original sin modificar.
const NAME_EN_FALLBACK = '["coalesce",["get","name_en"],["get","name"]]';
const NAME_ES_FALLBACK = '["coalesce",["get","name:es"],["get","name_en"],["get","name"]]';

let stylePromise: Promise<string | StyleSpecification> | null = null;

function loadStyleWithSpanishLabels(): Promise<string | StyleSpecification> {
  if (!stylePromise) {
    stylePromise = fetch(OPENFREEMAP_STYLE)
      .then((res) => res.json())
      .then(
        (style) =>
          JSON.parse(
            JSON.stringify(style).replaceAll(NAME_EN_FALLBACK, NAME_ES_FALLBACK),
          ) as StyleSpecification,
      )
      .catch(() => OPENFREEMAP_STYLE);
  }
  return stylePromise;
}

const SOURCE_ID = 'stations';
const CLUSTER_LAYER_ID = 'station-clusters';
const CLUSTER_COUNT_LAYER_ID = 'station-cluster-count';
const POINT_LAYER_ID = 'station-points';

const STATUS_COLOR_EXPRESSION: ExpressionSpecification = [
  'match',
  ['get', 'status'],
  'active',
  '#16a34a',
  'incomplete',
  '#eab308',
  'inactive',
  '#dc2626',
  'planned',
  '#64748b',
  /* default */ '#2563eb',
];

export interface MapViewProps {
  stations: StationFeatureCollection;
  selectedStationId?: string | null;
  onSelectStation?: (id: string | null) => void;
  interactive?: boolean;
  /** Si no se pasa, el mapa encuadra automáticamente a las estaciones cargadas en vez de usar un centro/zoom fijo. */
  initialCenter?: [number, number];
  initialZoom?: number;
  className?: string;
}

const ARGENTINA_CENTER: [number, number] = [-64.5, -34.5];

function radiusExpression(selectedStationId: string | null): ExpressionSpecification {
  return [
    'case',
    ['==', ['get', 'id'], selectedStationId ?? ''],
    11,
    ['==', ['get', 'isHighPower'], true],
    9,
    7,
  ];
}

function strokeWidthExpression(selectedStationId: string | null): ExpressionSpecification {
  return ['case', ['==', ['get', 'id'], selectedStationId ?? ''], 3, 1.5];
}

export default function MapView({
  stations,
  selectedStationId = null,
  onSelectStation,
  interactive = true,
  initialCenter,
  initialZoom,
  className = 'h-full w-full',
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const onSelectRef = useRef(onSelectStation);
  const stationsRef = useRef(stations);
  const selectedStationIdRef = useRef(selectedStationId);
  const autoFit = initialCenter === undefined && initialZoom === undefined;

  useEffect(() => {
    onSelectRef.current = onSelectStation;
  }, [onSelectStation]);

  useEffect(() => {
    stationsRef.current = stations;
  }, [stations]);

  useEffect(() => {
    selectedStationIdRef.current = selectedStationId;
  }, [selectedStationId]);

  /** Centra el mapa en una estación puntual sin alejar si ya está más cerca que ese nivel. */
  function flyToStation(map: MapLibreMap, id: string) {
    const feature = stationsRef.current.features.find((f) => f.properties.id === id);
    if (!feature) return;
    const [lng, lat] = feature.geometry.coordinates as [number, number];
    map.easeTo({ center: [lng, lat], zoom: Math.max(map.getZoom(), 10), duration: 700 });
  }

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    loadStyleWithSpanishLabels().then((style) => {
      if (cancelled || !containerRef.current) return;

      const map = new MapLibreMap({
        container: containerRef.current,
        style,
        center: initialCenter ?? ARGENTINA_CENTER,
        zoom: initialZoom ?? 3.6,
        attributionControl: { compact: true },
        locale: {
          'NavigationControl.ZoomIn': 'Acercar',
          'NavigationControl.ZoomOut': 'Alejar',
          'NavigationControl.ResetBearing': 'Reorientar al norte',
          'AttributionControl.ToggleAttribution': 'Mostrar/ocultar atribución',
        },
        scrollZoom: interactive,
        dragPan: interactive,
        dragRotate: false,
        touchZoomRotate: interactive,
        doubleClickZoom: interactive,
        boxZoom: interactive,
        keyboard: interactive,
      });

      mapRef.current = map;

      if (interactive) {
        map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
      }

      map.on('error', (e) => {
        console.error('[MapView] maplibre error event:', e.error);
      });

      map.on('load', () => {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data: stations,
          cluster: true,
          clusterMaxZoom: 9,
          clusterRadius: 40,
        });

        // Sin centro/zoom explícitos, encuadrar a las estaciones cargadas en vez de un centro fijo:
        // con un país tan angosto y diagonal como Argentina, un zoom fijo deja medio mapa mostrando
        // países vecinos y océano. Solo se hace una vez, al cargar; no se re-encuadra al filtrar.
        if (
          initialCenter === undefined &&
          initialZoom === undefined &&
          stations.features.length > 0
        ) {
          const bounds = new LngLatBounds();
          for (const feature of stations.features) {
            bounds.extend(feature.geometry.coordinates as [number, number]);
          }
          if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: 48, maxZoom: 11, duration: 0 });
          }
        }

        // Si se llegó con una estación ya seleccionada (deep link vía ?estacion=), centrar en ella
        // en vez de dejar el encuadre general de arriba como única vista.
        if (selectedStationIdRef.current) {
          flyToStation(map, selectedStationIdRef.current);
        }

        map.addLayer({
          id: CLUSTER_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#1d4ed8',
            'circle-opacity': 0.85,
            'circle-radius': ['step', ['get', 'point_count'], 16, 10, 20, 30, 26],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
          },
        });

        map.addLayer({
          id: CLUSTER_COUNT_LAYER_ID,
          type: 'symbol',
          source: SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': ['get', 'point_count_abbreviated'],
            'text-size': 12,
            'text-font': ['Noto Sans Bold'],
          },
          paint: { 'text-color': '#ffffff' },
        });

        map.addLayer({
          id: POINT_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': STATUS_COLOR_EXPRESSION,
            'circle-radius': radiusExpression(selectedStationId),
            'circle-stroke-width': strokeWidthExpression(selectedStationId),
            'circle-stroke-color': [
              'case',
              ['==', ['get', 'id'], selectedStationId ?? ''],
              '#2563eb',
              '#ffffff',
            ],
          },
        });

        if (interactive) {
          map.on('click', POINT_LAYER_ID, (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
            const id = feature?.properties?.id as string | undefined;
            if (id) onSelectRef.current?.(id);
          });

          map.on('click', CLUSTER_LAYER_ID, async (event: MapLayerMouseEvent) => {
            const feature = event.features?.[0] as MapGeoJSONFeature | undefined;
            const clusterId = feature?.properties?.cluster_id as number | undefined;
            const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
            if (clusterId === undefined || !source || !feature) return;
            const zoom = await source.getClusterExpansionZoom(clusterId);
            const [lng, lat] = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
            map.easeTo({ center: [lng, lat], zoom });
          });

          for (const layerId of [POINT_LAYER_ID, CLUSTER_LAYER_ID]) {
            map.on('mouseenter', layerId, () => {
              map.getCanvas().style.cursor = 'pointer';
            });
            map.on('mouseleave', layerId, () => {
              map.getCanvas().style.cursor = '';
            });
          }
        }
      });
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // El mapa se inicializa una sola vez; las actualizaciones de datos/selección se aplican en los efectos de abajo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;
    if (!source) return; // el mapa todavía no terminó de cargar su estilo (ver el efecto de montaje)
    source.setData(stations);

    // Re-encuadrar cuando cambia el conjunto de estaciones (p. ej. al aplicar un filtro), para que
    // el mapa no se quede mostrando una zona vacía si el filtro apunta a otra parte del país. Este
    // efecto no hace nada en el montaje (el `source` todavía no existe hasta que termina `map.on
    // ('load')`, que ya hace su propio fitBounds instantáneo), así que solo se re-encuadra acá ante
    // cambios reales posteriores.
    if (autoFit && stations.features.length > 0) {
      const bounds = new LngLatBounds();
      for (const feature of stations.features) {
        bounds.extend(feature.geometry.coordinates as [number, number]);
      }
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, { padding: 48, maxZoom: 11, duration: 600 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(POINT_LAYER_ID)) return;
    map.setPaintProperty(POINT_LAYER_ID, 'circle-radius', radiusExpression(selectedStationId));
    map.setPaintProperty(
      POINT_LAYER_ID,
      'circle-stroke-width',
      strokeWidthExpression(selectedStationId),
    );
    // Centrar la cámara en la estación elegida (por búsqueda o por el listado): antes esto solo
    // resaltaba el punto con un anillo, así que si la estación estaba fuera del encuadre actual
    // (p. ej. buscar "Ushuaia" con el mapa centrado en Buenos Aires) no había ninguna señal visual
    // de dónde quedaba ni de que la selección hubiera funcionado.
    if (selectedStationId) flyToStation(map, selectedStationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStationId]);

  return (
    <div
      ref={containerRef}
      className={className}
      role="application"
      aria-label="Mapa de estaciones de TDA"
    />
  );
}
