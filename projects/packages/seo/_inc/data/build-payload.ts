// Pure helpers that turn the Settings form's local state into the changed-fields
// payloads for the two REST endpoints the SEO Settings tab writes to. Kept free
// of React/WordPress runtime imports so the diffing behavior can be unit-tested
// in isolation (see `test/build-payload.test.ts`).

import { VERIFICATION_KEYS } from './verification-services';
import type { SettingsResponse } from './settings-types';

/**
 * Build the changed-fields payload for WordPress core's settings endpoint
 * (`/wp/v2/settings`) — every SEO setting that's backed by an option, which is
 * all of them except the site-verification module's activation state.
 *
 * Only changed fields are included, so an unchanged save is a no-op. The server
 * owns validation and sanitization for every key here (see
 * `Dashboard_Data::register_rest_settings()`).
 *
 * @param baseline - The last-saved server state.
 * @param local    - The current form state.
 * @return The changed-fields payload for `/wp/v2/settings`.
 */
export function buildCorePayload(
	baseline: SettingsResponse,
	local: SettingsResponse
): Record< string, unknown > {
	const payload: Record< string, unknown > = {};

	// Search-engine visibility maps to the core `blog_public` option
	// (1 = allow indexing, 0 = discourage).
	if ( local.search_engines_visible !== baseline.search_engines_visible ) {
		payload.blog_public = local.search_engines_visible ? 1 : 0;
	}
	if ( local.sitemap_active !== baseline.sitemap_active ) {
		payload.jetpack_seo_sitemap_enabled = local.sitemap_active;
	}
	if ( local.canonical_active !== baseline.canonical_active ) {
		payload.jetpack_seo_canonical_urls_enabled = local.canonical_active;
	}
	if (
		baseline.title_formats_editable &&
		JSON.stringify( local.title_formats ) !== JSON.stringify( baseline.title_formats )
	) {
		payload.advanced_seo_title_formats = local.title_formats;
	}
	if ( local.front_page_description !== baseline.front_page_description ) {
		payload.advanced_seo_front_page_description = local.front_page_description;
	}
	// The codes are sub-keys of one option, so the whole map goes when any of them
	// changes; the server merges it over the codes already stored.
	if (
		VERIFICATION_KEYS.some( key => local.verification[ key ] !== baseline.verification[ key ] )
	) {
		payload.verification_services_codes = local.verification;
	}

	return payload;
}

/**
 * Build the changed-fields payload for the package's module route
 * (`/jetpack/v4/seo/modules`). Site verification is a Jetpack module rather than
 * an option, which is the one thing `register_setting()` can't express — so it's
 * the only field that doesn't go through core's settings endpoint.
 *
 * @param baseline - The last-saved server state.
 * @param local    - The current form state.
 * @return The payload for `/jetpack/v4/seo/modules`, or `{}` if unchanged.
 */
export function buildModulesPayload(
	baseline: SettingsResponse,
	local: SettingsResponse
): Record< string, unknown > {
	if ( local.verification_tools_active === baseline.verification_tools_active ) {
		return {};
	}

	return { verification_tools_active: local.verification_tools_active };
}
