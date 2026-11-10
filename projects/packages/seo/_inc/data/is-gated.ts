/**
 * Compatibility accessor for integrations using the former plan gate.
 *
 * @return Whether SEO requires an upgrade.
 */
export function isGated(): boolean {
	return false;
}

/**
 * Compatibility accessor for integrations using the former upgrade link.
 *
 * @return An empty upgrade URL.
 */
export function getUpsellUrl(): string {
	return '';
}
