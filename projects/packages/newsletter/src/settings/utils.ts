/**
 * Analytics utilities for Newsletter settings
 */

import type { JetpackNewsletterSettings } from './types';

/**
 * Site types for analytics tracking
 */
export type SiteType = 'simple' | 'atomic' | 'jetpack';

/**
 * Get the site type from settings
 *
 * @param {JetpackNewsletterSettings | undefined} settings - Settings from PHP
 * @return {SiteType} The site type
 */
export function getSiteType( settings: JetpackNewsletterSettings | undefined ): SiteType {
	if ( ! settings ) {
		return 'jetpack';
	}

	if ( settings.isWpcomSimple ) {
		return 'simple';
	}

	if ( settings.isWpcomPlatform ) {
		return 'atomic';
	}

	return 'jetpack';
}
