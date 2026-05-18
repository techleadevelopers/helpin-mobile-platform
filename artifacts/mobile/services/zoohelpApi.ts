import { ZooHelpEngine, type AccountType, type PostContract, type PostType } from '@workspace/zoohelp-engine';

import type { Author, Post } from '@/constants/data';

declare const process: { env?: Record<string, string | undefined> };

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const AUTH_TOKEN_KEY = 'authToken';

export const backendEnabled = Boolean(API_BASE_URL);

export function createZooHelpApi(getAccessToken?: () => Promise<string | null> | string | null) {
  if (!API_BASE_URL) return null;
  return new ZooHelpEngine({
    apiBaseUrl: API_BASE_URL,
    getAccessToken,
    runtime: 'expo',
  });
}

export { AUTH_TOKEN_KEY };

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
    textOnly: post.textOnly,
    author: mapAuthor(post.author),
    likes: post.likes,
    comments: post.comments,
    shares: post.shares,
    urgent: post.urgent,
    createdAt: post.createdAt,
    contact: post.contact,
    tags: post.tags,
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
) {
  const contentType = contentTypeFromUri(uri);
  const fileName = fileNameFromUri(uri);
  const response = await fetch(uri);
  const blob = await response.blob();
  const uploadIntent = await api.createMediaUploadIntent({
    fileName,
    contentType,
    sizeBytes: blob.size,
  });

  const form = new FormData();
  form.append('api_key', uploadIntent.cloudinary.apiKey);
  form.append('timestamp', String(uploadIntent.cloudinary.timestamp));
  form.append('signature', uploadIntent.cloudinary.signature);
  form.append('folder', uploadIntent.cloudinary.folder);
  form.append('public_id', uploadIntent.cloudinary.publicId);
  form.append('file', {
    uri,
    name: fileName,
    type: contentType,
  } as unknown as Blob);

  const cloudinaryResponse = await fetch(uploadIntent.uploadUrl, {
    method: 'POST',
    body: form,
  });
  if (!cloudinaryResponse.ok) {
    throw new Error(`Cloudinary upload failed: ${cloudinaryResponse.status}`);
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
