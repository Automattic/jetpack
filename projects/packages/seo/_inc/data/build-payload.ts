// Pure helpers that turn the Settings form's local state into the changed-fields
// payloads for the two REST endpoints the SEO Settings tab writes to. Kept free
// of React/WordPress runtime imports so the diffing behavior can be unit-tested
// in isolation (see `test/build-payload.test.ts`).

import { VERIFICATION_KEYS } from './verification-services';
import type { SettingsResponse } from './settings-types';

/**
 * Build the changed-fields payload for the Jetpack settings endpoint
 * (`/jetpack/v4/settings`) — everything except search-engine visibility, which
 * is a WordPress core option handled separately. Only changed fields are
 * included so an unchanged save never re-toggles the sitemaps module. The
 * endpoint owns validation/sanitization for every key here.
 *
 * @param baseline - The last-saved server state.
 * @param local    - The current form state.
 * @return The changed-fields payload for `/jetpack/v4/settings`.
 */
export function buildJetpackPayload(
	baseline: SettingsResponse,
	local: SettingsResponse
): Record< string, unknown > {
	const payload: Record< string, unknown > = {};

	if ( local.sitemap_active !== baseline.sitemap_active ) {
		payload.sitemaps = local.sitemap_active;
	}
	if ( local.canonical_active !== baseline.canonical_active ) {
		// The payload key is the module slug; `/jetpack/v4/settings` toggles the module.
		payload[ 'canonical-urls' ] = local.canonical_active;
	}
	if ( JSON.stringify( local.title_formats ) !== JSON.stringify( baseline.title_formats ) ) {
		payload.advanced_seo_title_formats = local.title_formats;
	}
	if ( local.front_page_description !== baseline.front_page_description ) {
		payload.advanced_seo_front_page_description = local.front_page_description;
	}
	VERIFICATION_KEYS.forEach( key => {
		if ( local.verification[ key ] !== baseline.verification[ key ] ) {
			payload[ key ] = local.verification[ key ];
		}
	} );

	return payload;
}

/**
 * Build the changed-fields payload for WordPress core settings
 * (`/wp/v2/settings`). Search-engine visibility maps to the core `blog_public`
 * option (1 = allow indexing, 0 = discourage); the Jetpack settings endpoint
 * rejects it, so it round-trips through core REST instead.
 *
 * @param baseline - The last-saved server state.
 * @param local    - The current form state.
 * @return The changed-fields payload for `/wp/v2/settings`, or `{}` if unchanged.
 */
export function buildCorePayload(
	baseline: SettingsResponse,
	local: SettingsResponse
): Record< string, unknown > {
	const payload: Record< string, unknown > = {};

	if ( local.search_engines_visible !== baseline.search_engines_visible ) {
		payload.blog_public = local.search_engines_visible ? 1 : 0;
	}

	return payload;
}
