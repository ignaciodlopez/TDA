export interface Province {
  id: string;
  slug: string;
  name: string;
  centroid: { latitude: number; longitude: number };
}

export interface Locality {
  id: string;
  slug: string;
  name: string;
  provinceId: string;
  department: string | null;
  postalCode: string | null;
  latitude: number;
  longitude: number;
}

export interface Operator {
  id: string;
  slug: string;
  name: string;
  type: 'public' | 'private' | 'mixed';
  description: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}
