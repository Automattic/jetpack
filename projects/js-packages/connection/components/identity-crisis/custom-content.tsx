import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import type { IdentityCrisisCustomContent } from './types';
import type { ReactElement, ReactNode } from 'react';

/**
 * The Safe Mode support page, or the plugin's own.
 *
 * @param customContent - Plugin overrides.
 * @return The URL.
 */
export function getSupportUrl( customContent: IdentityCrisisCustomContent = {} ): string {
	// Widened: it comes from a PHP filter, so the declared string type is not guaranteed.
	const supportURL: unknown = customContent.supportURL;
	return typeof supportURL === 'string' && /^https?:\/\//i.test( supportURL )
		? supportURL
		: getRedirectUrl( 'jetpack-support-safe-mode' );
}

/**
 * Render a plugin's override with the tags the earlier screen accepted, or the default.
 *
 * @param override      - The plugin's text, if any. It comes from a PHP filter, so it is checked, not trusted.
 * @param fallback      - The default content.
 * @param customContent - Plugin overrides, for the support link.
 * @param extraTags     - More tags the override may use.
 * @return The content.
 */
export function renderCustomContent(
	override: unknown,
	fallback: ReactNode,
	customContent: IdentityCrisisCustomContent = {},
	extraTags: Record< string, ReactElement > = {}
): ReactNode {
	if ( typeof override !== 'string' || ! override ) {
		return fallback;
	}

	try {
		return createInterpolateElement( override, {
			em: <em />,
			strong: <strong />,
			hostname: <strong />,
			safeModeLink: (
				<a href={ getSupportUrl( customContent ) } target="_blank" rel="noopener noreferrer" />
			),
			...extraTags,
		} );
	} catch {
		// A tag outside the map throws; show the text rather than break the screen.
		return override;
	}
}
