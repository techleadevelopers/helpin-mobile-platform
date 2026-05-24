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
  if (!query || !GOOGLE_MAPS_API_KEY) return null;

  // 🔧 CORREÇÃO: Sanitiza endereços com erros comuns
  const sanitized = query
    .toLowerCase()
    // Corrige "doutro" → "doutor"
    .replace(/\bdoutro\b/gi, 'Doutor')
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

  try {
    const params = new URLSearchParams({
      address: sanitized,  // ← usa o endereço sanitizado
      region: 'br',
      key: GOOGLE_MAPS_API_KEY,
    });
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
    if (!response.ok) return null;
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
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return {
      latitude: lat,
      longitude: lng,
      label: result?.formatted_address ?? sanitized, // retorna o corrigido se a API achou
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
    images: post.images?.map((image) => image.url) ?? [],
    textOnly: post.textOnly,
    author: mapAuthor(post.author),
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
    urgent: post.urgent,
    rescueStatus: post.rescueStatus,
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
