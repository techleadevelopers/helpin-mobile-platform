import { ZooHelpEngine, type AccountType, type PostContract, type PostType } from '@/services/zoohelpEngine';
import type { Author, Post } from '@/constants/data';
import { Platform } from 'react-native';
import { ACCESS_TOKEN_KEY, getStoredAccessToken } from '@/services/secureSession';

declare const process: { env?: Record<string, string | undefined> };

const DEFAULT_API_BASE_URL = 'https://zoohelp-core-production.up.railway.app';
export const API_BASE_URL = (process.env?.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
const GOOGLE_MAPS_API_KEY = process.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const AUTH_TOKEN_KEY = ACCESS_TOKEN_KEY;
export const supportPaymentsEnabled = process.env?.EXPO_PUBLIC_SUPPORT_PAYMENTS_ENABLED === 'true';

export const backendEnabled = Boolean(API_BASE_URL);

export function createZooHelpApi(getAccessToken: () => Promise<string | null> | string | null = getStoredAccessToken) {
  if (!API_BASE_URL) return null;
  return new ZooHelpEngine({
    apiBaseUrl: API_BASE_URL,
    getAccessToken,
    runtime: 'expo',
  });
}

export { AUTH_TOKEN_KEY };

declare global {
  interface Window {
    google?: any;
    __zoohelpGoogleMapsPromise?: Promise<any>;
  }
}

function loadGoogleMapsForWeb() {
  if (Platform.OS !== 'web' || !GOOGLE_MAPS_API_KEY || typeof window === 'undefined') return null;
  if (window.google?.maps?.places) return Promise.resolve(window.google);
  if (window.__zoohelpGoogleMapsPromise) return window.__zoohelpGoogleMapsPromise;

  window.__zoohelpGoogleMapsPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-zoohelp-google-maps="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&language=pt-BR&region=BR`;
    script.async = true;
    script.defer = true;
    script.dataset.zoohelpGoogleMaps = 'true';
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return window.__zoohelpGoogleMapsPromise;
}

async function geocodeAddressWithWebSdk(address: string) {
  const google = await loadGoogleMapsForWeb()?.catch(() => null);
  if (!google?.maps?.Geocoder) return null;

  return new Promise<{ label: string; latitude: number; longitude: number } | null>((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address, region: 'BR' }, (results: any[] | null, status: string) => {
      if (status !== 'OK' || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }
      const location = results[0].geometry.location;
      resolve({
        label: results[0].formatted_address ?? address,
        latitude: location.lat(),
        longitude: location.lng(),
      });
    });
  });
}

async function geocodeAddressWithOpenStreetMap(address: string) {
  try {
    const params = new URLSearchParams({
      q: `${address}, Brasil`,
      format: 'json',
      limit: '1',
      countrycodes: 'br',
      addressdetails: '1',
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
    });
    if (!response.ok) return null;

    const payload = (await response.json()) as Array<{
      display_name?: string;
      lat?: string;
      lon?: string;
    }>;
    const result = payload[0];
    const latitude = Number(result?.lat);
    const longitude = Number(result?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

    return {
      latitude,
      longitude,
      label: result.display_name || address,
    };
  } catch {
    return null;
  }
}

export async function geocodeStructuredAddress(input: {
  street: string;
  number: string;
  neighborhood?: string;
  city: string;
  state: string;
}) {
  const street = [input.number.trim(), input.street.trim()].filter(Boolean).join(' ');
  const state = input.state.trim().toUpperCase();
  const attempts = [
    new URLSearchParams({
      street,
      city: input.city.trim(),
      state,
      country: 'Brazil',
      format: 'json',
      limit: '1',
      countrycodes: 'br',
      addressdetails: '1',
    }),
    new URLSearchParams({
      q: [input.street.trim(), input.number.trim(), input.neighborhood?.trim(), input.city.trim(), state, 'Brasil']
        .filter(Boolean)
        .join(', '),
      format: 'json',
      limit: '1',
      countrycodes: 'br',
      addressdetails: '1',
    }),
  ];

  for (const params of attempts) {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
      });
      if (!response.ok) {
        console.warn('Structured OpenStreetMap geocode HTTP error', response.status);
        continue;
      }
      const payload = (await response.json()) as Array<{ display_name?: string; lat?: string; lon?: string }>;
      const result = payload[0];
      const latitude = Number(result?.lat);
      const longitude = Number(result?.lon);
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
      return {
        latitude,
        longitude,
        label: result.display_name || [input.street, input.number, input.neighborhood, input.city, state].filter(Boolean).join(', '),
      };
    } catch (error) {
      console.warn('Structured OpenStreetMap geocode failed', error);
      // Try the next structured query shape.
    }
  }

  return null;
}

async function placeDetailsWithWebSdk(placeId: string) {
  const google = await loadGoogleMapsForWeb()?.catch(() => null);
  if (!google?.maps?.Geocoder) return null;

  return new Promise<{ label: string; latitude: number; longitude: number } | null>((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId }, (results: any[] | null, status: string) => {
      if (status !== 'OK' || !results?.[0]?.geometry?.location) {
        resolve(null);
        return;
      }
      const location = results[0].geometry.location;
      resolve({
        label: results[0].formatted_address ?? '',
        latitude: location.lat(),
        longitude: location.lng(),
      });
    });
  });
}

async function addressSuggestionsWithWebSdk(input: string) {
  const google = await loadGoogleMapsForWeb()?.catch(() => null);
  if (!google?.maps?.Geocoder) return [];

  return new Promise<Array<{ id: string; label: string }>>((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ address: input, region: 'BR' }, (results: any[] | null, status: string) => {
      if (status !== 'OK' || !results) {
        resolve([]);
        return;
      }
      resolve(
        results
          .filter((item) => item.place_id && item.formatted_address)
          .slice(0, 5)
          .map((item) => ({ id: item.place_id, label: item.formatted_address })),
      );
    });
  });
}

export async function getStaticMapUrl(input: {
  lat: number;
  lng: number;
  zoom?: number;
  width?: number;
  height?: number;
}) {
  const params = new URLSearchParams({
    lat: String(input.lat),
    lng: String(input.lng),
    zoom: String(input.zoom ?? 14),
    width: String(input.width ?? 640),
    height: String(input.height ?? 320),
  });

  try {
    const response = await fetch(`${API_BASE_URL}/v1/maps/static-url?${params.toString()}`);
    if (response.ok) {
      const payload = (await response.json()) as { imageUrl?: string };
      if (payload.imageUrl) return payload.imageUrl;
    }
  } catch {
    // Fall back to direct Static Maps while the backend is unavailable.
  }

  if (!GOOGLE_MAPS_API_KEY) return null;

  const marker = `color:green|label:Z|${input.lat},${input.lng}`;
  const directParams = new URLSearchParams({
    center: `${input.lat},${input.lng}`,
    zoom: String(input.zoom ?? 14),
    size: `${input.width ?? 640}x${input.height ?? 320}`,
    scale: '2',
    maptype: 'roadmap',
    markers: marker,
    key: GOOGLE_MAPS_API_KEY,
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${directParams.toString()}`;
}

export async function geocodeAddress(address: string) {
  const query = address.trim();
  if (!query) return null;

  // 🔧 CORREÇÃO: Sanitiza endereços com erros comuns
  const sanitized = query
    .toLowerCase()
    // Corrige "doutro" → "doutor"
    .replace(/\bdoutro\b/gi, 'Doutor')
    .replace(/\bqurino\b/gi, 'Quirino')
    .replace(/\bdr\s+(\w+)\b/gi, 'Doutor $1')
    // Corrige outras variações comuns
    .replace(/\bav\b/gi, 'Avenida')
    .replace(/\br\b/gi, 'Rua')
    .replace(/\bal\b/gi, 'Alameda')
    .replace(/\bpç\b/gi, 'Praça')
    // Padroniza maiúsculas (primeira letra de cada palavra)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  if (Platform.OS === 'web') {
    const webResult = await geocodeAddressWithWebSdk(sanitized);
    if (webResult) return webResult;
  }

  try {
    const params = new URLSearchParams({ address: sanitized });
    const response = await fetch(`${API_BASE_URL}/v1/maps/geocode?${params.toString()}`);
    if (response.ok) {
      const payload = (await response.json()) as { label?: string; latitude?: number; longitude?: number } | null;
      if (typeof payload?.latitude === 'number' && typeof payload.longitude === 'number') {
        return {
          latitude: payload.latitude,
          longitude: payload.longitude,
          label: payload.label || sanitized,
        };
      }
    }
  } catch {
    // Keep geocoding resilient while the backend maps proxy is unavailable.
  }

  if (!GOOGLE_MAPS_API_KEY) {
    return geocodeAddressWithOpenStreetMap(sanitized);
  }

  try {
    const params = new URLSearchParams({
      address: sanitized,  // ← usa o endereço sanitizado
      region: 'br',
      key: GOOGLE_MAPS_API_KEY,
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
    if (response.ok) {
      const payload = (await response.json()) as {
        results?: Array<{
          formatted_address?: string;
          geometry?: { location?: { lat?: number; lng?: number } };
        }>;
        status?: string;
      };
      const result = payload.results?.[0];
      const lat = result?.geometry?.location?.lat;
      const lng = result?.geometry?.location?.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        return {
          latitude: lat,
          longitude: lng,
          label: result?.formatted_address ?? sanitized, // retorna o corrigido se a API achou
        };
      }
    }
  } catch {
    // Keep the public-address fallback below available if direct Google is blocked.
  }

  return geocodeAddressWithOpenStreetMap(sanitized);
}

export async function searchAddressSuggestions(input: string) {
  const query = input.trim();
  if (query.length < 3) return [];

  if (Platform.OS === 'web') {
    return addressSuggestionsWithWebSdk(query);
  }

  try {
    const params = new URLSearchParams({ input: query });
    const response = await fetch(`${API_BASE_URL}/v1/maps/place-autocomplete?${params.toString()}`);
    if (response.ok) {
      const payload = (await response.json()) as {
        predictions?: Array<{ placeId?: string; place_id?: string; description?: string }>;
      };
      return (payload.predictions ?? [])
        .map((item) => ({ id: item.placeId ?? item.place_id ?? '', label: item.description ?? '' }))
        .filter((item) => item.id && item.label)
        .slice(0, 5);
    }
  } catch {
    // Browser CORS blocks direct Google Places; keep web quiet.
  }

  if (!GOOGLE_MAPS_API_KEY) return [];

  try {
    const params = new URLSearchParams({
      input: query,
      key: GOOGLE_MAPS_API_KEY,
      components: 'country:br',
      types: 'address',
      language: 'pt-BR',
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`);
    if (!response.ok) return [];
    const payload = (await response.json()) as {
      predictions?: Array<{ place_id?: string; description?: string }>;
    };

    return (payload.predictions ?? [])
      .filter((item): item is { place_id: string; description: string } => Boolean(item.place_id && item.description))
      .slice(0, 5)
      .map((item) => ({ id: item.place_id, label: item.description }));
  } catch {
    return [];
  }
}

export async function getPlaceAddressDetails(placeId: string) {
  if (!placeId) return null;

  if (Platform.OS === 'web') {
    return placeDetailsWithWebSdk(placeId);
  }

  try {
    const params = new URLSearchParams({ placeId, place_id: placeId });
    const response = await fetch(`${API_BASE_URL}/v1/maps/place-details?${params.toString()}`);
    if (response.ok) {
      const payload = (await response.json()) as { label?: string; latitude?: number; longitude?: number } | null;
      if (typeof payload?.latitude === 'number' && typeof payload.longitude === 'number') {
        return {
          label: payload.label ?? '',
          latitude: payload.latitude,
          longitude: payload.longitude,
        };
      }
    }
  } catch {
    // Browser CORS blocks direct Google Places details; keep web quiet.
  }

  if (!GOOGLE_MAPS_API_KEY) return null;

  try {
    const params = new URLSearchParams({
      place_id: placeId,
      key: GOOGLE_MAPS_API_KEY,
      fields: 'geometry,formatted_address',
      language: 'pt-BR',
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      result?: {
        formatted_address?: string;
        geometry?: { location?: { lat?: number; lng?: number } };
      };
    };
    const lat = payload.result?.geometry?.location?.lat;
    const lng = payload.result?.geometry?.location?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;

    return {
      label: payload.result?.formatted_address ?? '',
      latitude: lat,
      longitude: lng,
    };
  } catch {
    return null;
  }
}

export function mapAuthor(author: PostContract['author']): Author {
  return {
    id: author.id,
    name: author.name,
    avatar: author.avatar,
    verified: author.verified,
    type: author.type,
  };
}

export function mapPost(post: PostContract): Post {
  const imageUrls = Array.from(new Set([
    ...(post.images?.map((image) => image.url).filter(Boolean) ?? []),
    ...(post.image ? [post.image] : []),
  ]));

  return {
    id: post.id,
    type: post.type,
    animalType: post.animalType,
    name: post.name,
    breed: post.breed,
    age: post.age,
    description: post.description,
    location: post.location,
    neighborhood: post.neighborhood,
    image: post.image,
    images: imageUrls,
    textOnly: post.textOnly,
    author: mapAuthor(post.author),
    likes: post.likes,
    likedByMe: post.likedByMe,
    comments: post.comments,
    shares: post.shares,
    urgent: post.urgent,
    rescueStatus: post.rescueStatus,
    rescueOperational: post.rescueOperational,
    resolvedAt: post.resolvedAt,
    createdAt: post.createdAt,
    contact: post.contact,
    tags: post.tags,
    latitude: post.latitude,
    longitude: post.longitude,
  };
}

export function inferPostType(type: Post['type']): PostType {
  return type;
}

export function inferAccountType(type: AccountType | 'admin' | undefined): AccountType {
  return type === 'ong' || type === 'vet' ? type : 'person';
}

export function contentTypeFromUri(uri: string) {
  const cleanUri = uri.split('?')[0]?.toLowerCase() ?? uri.toLowerCase();
  if (cleanUri.endsWith('.png')) return 'image/png';
  if (cleanUri.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export function fileNameFromUri(uri: string) {
  const fileName = uri.split('/').pop()?.split('?')[0];
  return fileName && fileName.includes('.') ? fileName : `zoohelp-${Date.now()}.jpg`;
}

export async function uploadLocalImageToCloudinary(
  api: NonNullable<ReturnType<typeof createZooHelpApi>>,
  uri: string,
  purpose: 'post' | 'ong-logo' | 'profile-avatar' | 'kyb-document' = 'post',
) {
  const contentType = contentTypeFromUri(uri);
  const fileName = fileNameFromUri(uri);
  const response = await fetch(uri);
  const blob = await response.blob();
  const uploadIntent = await api.createMediaUploadIntent({
    fileName,
    contentType,
    sizeBytes: blob.size,
    purpose,
  });

  const form = new FormData();
  form.append('api_key', uploadIntent.cloudinary.apiKey);
  form.append('timestamp', String(uploadIntent.cloudinary.timestamp));
  form.append('signature', uploadIntent.cloudinary.signature);
  form.append('folder', uploadIntent.cloudinary.folder);
  form.append('public_id', uploadIntent.cloudinary.publicId);
  if (Platform.OS === 'web') {
    form.append('file', blob, fileName);
  } else {
    form.append('file', {
      uri,
      name: fileName,
      type: contentType,
    } as unknown as Blob);
  }

  const cloudinaryResponse = await fetch(uploadIntent.uploadUrl, {
    method: 'POST',
    body: form,
  });
  if (!cloudinaryResponse.ok) {
    const errorText = await cloudinaryResponse.text().catch(() => '');
    throw new Error(`Cloudinary upload failed: ${cloudinaryResponse.status}${errorText ? ` ${errorText}` : ''}`);
  }

  const payload = (await cloudinaryResponse.json()) as {
    secure_url?: string;
    url?: string;
    width?: number;
    height?: number;
    bytes?: number;
    resource_type?: string;
  };

  return {
    objectKey: uploadIntent.objectKey,
    publicUrl: payload.secure_url ?? payload.url ?? uploadIntent.publicUrl,
    contentType,
    width: payload.width,
    height: payload.height,
    sizeBytes: payload.bytes ?? blob.size,
  };
}
