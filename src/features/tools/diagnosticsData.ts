export interface DiagnosticCause {
  id: string;
  label: string;
  guideHref?: string;
}

export interface DiagnosticSymptom {
  id: string;
  label: string;
  /** Causas ordenadas de lo más simple/probable a lo más técnico. */
  causeIds: string[];
}

export const CAUSES: Record<string, DiagnosticCause> = {
  'repetir-busqueda': { id: 'repetir-busqueda', label: 'Repetir la búsqueda automática de canales' },
  cableado: {
    id: 'cableado',
    label: 'Revisar conectores y cableado (dobleces, cables pisados o mal enroscados)',
    guideHref: '/guias/senal-pixelada-y-cortes',
  },
  'tipo-antena': { id: 'tipo-antena', label: 'Verificar que la antena sea apta para UHF' },
  cobertura: { id: 'cobertura', label: 'Confirmar que estás dentro del área de cobertura estimada', guideHref: '/mapa' },
  orientacion: {
    id: 'orientacion',
    label: 'Revisar la orientación de la antena hacia la estación transmisora',
    guideHref: '/herramientas/orientar-antena',
  },
  obstaculos: { id: 'obstaculos', label: 'Considerar obstáculos del entorno: edificios, árboles o relieve' },
  divisor: { id: 'divisor', label: 'Revisar si un divisor (splitter) está reduciendo demasiado la señal' },
  interferencias: { id: 'interferencias', label: 'Descartar interferencias de otros equipos electrónicos' },
  'altura-antena': { id: 'altura-antena', label: 'Evaluar si conviene elevar la antena o cambiarla de lugar' },
  'compatibilidad-tv': {
    id: 'compatibilidad-tv',
    label: 'Confirmar que el televisor tenga sintonizador ISDB-T o usar un decodificador externo',
    guideHref: '/guias/que-es-la-tda',
  },
  consultar_instalador: { id: 'consultar_instalador', label: 'Si el problema persiste, considerar consultar a un instalador' },
};

export const SYMPTOMS: DiagnosticSymptom[] = [
  {
    id: 'sin-canales',
    label: 'No aparece ningún canal',
    causeIds: ['repetir-busqueda', 'cableado', 'tipo-antena', 'cobertura', 'orientacion', 'consultar_instalador'],
  },
  {
    id: 'faltan-canales',
    label: 'Faltan algunos canales',
    causeIds: ['orientacion', 'obstaculos', 'cobertura', 'repetir-busqueda'],
  },
  {
    id: 'pixelado',
    label: 'La imagen se pixela',
    causeIds: ['orientacion', 'altura-antena', 'cableado', 'obstaculos'],
  },
  {
    id: 'cortes',
    label: 'La señal se corta intermitentemente',
    causeIds: ['cableado', 'divisor', 'interferencias'],
  },
  {
    id: 'horarios',
    label: 'Hay señal solo en determinados horarios',
    causeIds: ['interferencias', 'consultar_instalador'],
  },
  {
    id: 'tv-no-reconoce',
    label: 'El televisor no reconoce la TDA',
    causeIds: ['compatibilidad-tv', 'repetir-busqueda'],
  },
  {
    id: 'antena-interior-no-funciona',
    label: 'La antena interior no funciona',
    causeIds: ['cobertura', 'tipo-antena', 'altura-antena', 'orientacion'],
  },
  {
    id: 'empeoro-con-divisor',
    label: 'La señal empeoró después de agregar un divisor',
    causeIds: ['divisor', 'cableado'],
  },
];
