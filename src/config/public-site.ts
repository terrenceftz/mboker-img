export interface PublicSiteConfig {
  site: string;
  allowedDomain: {
    protocol: string;
    hostname: string;
    port?: string;
  };
}

export function resolvePublicSiteConfig(
  value: string | undefined,
  fallback = 'https://tinks.netlify.app',
): PublicSiteConfig {
  const configured = value?.trim() || fallback;
  let url: URL;

  try {
    url = new URL(configured);
  } catch {
    throw new Error('PUBLIC_SITE_URL must be a valid absolute URL.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('PUBLIC_SITE_URL must use http or https.');
  }

  return {
    site: url.origin,
    allowedDomain: {
      protocol: url.protocol.slice(0, -1),
      hostname: url.hostname,
      ...(url.port ? { port: url.port } : {}),
    },
  };
}
