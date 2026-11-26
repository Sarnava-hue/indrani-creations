const DEFAULT_SITE_URL = "https://indranicreations.store";

export type SocialLink = {
  label: string;
  href: string;
};

function resolveSiteUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.trim()}`
      : "");

  if (!configured) {
    return DEFAULT_SITE_URL;
  }

  try {
    const parsed = new URL(configured);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return DEFAULT_SITE_URL;
    }

    return parsed.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

function normalizeHttpUrl(value: string | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.href;
  } catch {
    return null;
  }
}

/**
 * Extracts validated public social profile URLs from environment variables for
 * footer branding links and Schema.org OnlineStore.sameAs signals.
 */
export function resolveSocialLinks(
  env: Record<string, string | undefined> = process.env,
): SocialLink[] {
  const candidates: Array<{ label: string; value: string | undefined }> = [
    { label: "Instagram", value: env.NEXT_PUBLIC_INSTAGRAM_URL },
    { label: "Facebook", value: env.NEXT_PUBLIC_FACEBOOK_URL },
    { label: "YouTube", value: env.NEXT_PUBLIC_YOUTUBE_URL },
    { label: "Pinterest", value: env.NEXT_PUBLIC_PINTEREST_URL },
  ];

  const links: SocialLink[] = [];

  for (const candidate of candidates) {
    const href = normalizeHttpUrl(candidate.value);

    if (href) {
      links.push({ label: candidate.label, href });
    }
  }

  return links;
}

export const SITE_URL = resolveSiteUrl();
export const SOCIAL_LINKS = resolveSocialLinks();
