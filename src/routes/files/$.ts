import { createFileRoute } from '@tanstack/react-router';
import { AwsClient } from 'aws4fetch';

import { getAllConfigs } from '@/modules/config/service';

/**
 * Serves R2 objects through the site (set admin "R2 domain" to
 * https://<site>/files), so the bucket itself stays private. Only the key
 * shapes we write are allowed: photo uploads and generator outputs.
 */
const ALLOWED_KEY =
  /^uploads\/(?:[a-f0-9]{32}\.(?:jpg|png|webp)|generations\/[A-Za-z0-9_-]{1,64}\.(?:png|mp4))$/;

const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
};

async function GET({
  request,
  params,
}: {
  request: Request;
  params: { _splat?: string };
}) {
  const key = params._splat || '';
  if (!ALLOWED_KEY.test(key)) return new Response('Not found', { status: 404 });

  const configs = await getAllConfigs();
  if (
    !(configs.r2_access_key && configs.r2_secret_key && configs.r2_bucket_name)
  ) {
    return new Response('Not found', { status: 404 });
  }
  const endpoint = (
    configs.r2_endpoint ||
    `https://${configs.r2_account_id}.r2.cloudflarestorage.com`
  ).replace(/\/+$/, '');
  const client = new AwsClient({
    accessKeyId: configs.r2_access_key,
    secretAccessKey: configs.r2_secret_key,
    service: 's3',
    region: 'auto',
  });

  const range = request.headers.get('range');
  const upstream = await client.fetch(
    `${endpoint}/${configs.r2_bucket_name}/${key}`,
    { headers: range ? { range } : {} }
  );
  if (upstream.status !== 200 && upstream.status !== 206) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers({
    'Content-Type': CONTENT_TYPES[key.split('.').pop() || ''],
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  });
  for (const h of ['content-length', 'content-range', 'etag']) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
}

export const Route = createFileRoute('/files/$')({
  server: { handlers: { GET } },
});
