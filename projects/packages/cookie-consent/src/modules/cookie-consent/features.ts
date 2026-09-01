/**
 * Feature toggles
 *
 * Reads optional feature flags from the cookie-consent frontend config.
 */

/**
 * Check whether a named feature is enabled.
 *
 * Features are opt-out: a feature counts as enabled unless the consumer explicitly
 * sets it to `false`, so an unset or unknown feature reads as enabled.
 *
 * @param feature Feature key under `jetpackCookieConsentConfig.features`.
 * @return Whether the feature is enabled.
 */
export function isFeatureEnabled( feature: string ): boolean {
	return window.jetpackCookieConsentConfig?.features?.[ feature ] !== false;
}
