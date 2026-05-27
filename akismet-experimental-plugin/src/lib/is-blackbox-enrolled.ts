import { readGlobal } from '@/lib/is-jetpack-active';

/**
 * Whether this site is enrolled with Blackbox.
 *
 * Reads `window.akismetExperimental.blackbox.enrolled` (set by PHP). Server-side
 * PHP guards this — when `AKISMET_BLACKBOX_API_KEY` is missing, this returns
 * false. Per GUARDRAILS.md, the Bearer key itself never reaches the browser.
 *
 * @return True iff PHP reports the site enrolled.
 */
export function isBlackboxEnrolled(): boolean {
	return readGlobal().blackbox?.enrolled === true;
}

/**
 * Opaque Blackbox client identifier (public-key equivalent). Safe to surface
 * to the browser; identifies the site to Blackbox but isn't an auth secret.
 *
 * @return The client ID, or null when not enrolled.
 */
export function blackboxClientId(): string | null {
	return readGlobal().blackbox?.clientId ?? null;
}
