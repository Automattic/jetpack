/**
 * API utilities for newsletter settings
 *
 * On WordPress.com Simple sites, the Jetpack REST API is not directly accessible.
 * Instead, we use the WordPress.com REST API endpoint via `@wordpress/api-fetch`:
 * /rest/v1.4/sites/{SITE_ID}/settings
 */

import restApi from '@automattic/jetpack-api';
import apiFetch from '@wordpress/api-fetch';
import type { JetpackNewsletterSettings } from './types';

let apiInitialized = false;

/**
 * Initialize the REST API with settings from PHP.
 * Only needed for non-Simple sites. Call this before making API requests.
 *
 * @param {JetpackNewsletterSettings} jetpackSettings - Settings from PHP
 */
export function initializeApi( jetpackSettings: JetpackNewsletterSettings | undefined ): void {
	if ( apiInitialized || jetpackSettings?.isWpcomSimple ) {
		return;
	}

	if ( jetpackSettings?.restApiRoot && jetpackSettings?.restApiNonce ) {
		restApi.setApiRoot( jetpackSettings.restApiRoot );
		restApi.setApiNonce( jetpackSettings.restApiNonce );
		apiInitialized = true;
	}
}

/**
 * Fetch settings from the Jetpack REST API.
 * On Simple sites, uses the WordPress.com REST API.
 *
 * @param {JetpackNewsletterSettings} jetpackSettings - Settings from PHP
 * @return {Promise<Record<string, unknown>>} The settings object
 */
export async function fetchSettings(
	jetpackSettings: JetpackNewsletterSettings | undefined
): Promise< Record< string, unknown > > {
	if ( jetpackSettings?.isWpcomSimple && jetpackSettings?.blogID ) {
		return fetchSettingsViaWpcomApi( jetpackSettings.blogID );
	}

	// For non-Simple sites, use the standard API
	initializeApi( jetpackSettings );
	return restApi.fetchSettings();
}

/**
 * Update settings via the Jetpack REST API.
 * On Simple sites, uses the WordPress.com REST API.
 *
 * @param {Record<string, unknown>}   updates         - The settings to update
 * @param {JetpackNewsletterSettings} jetpackSettings - Settings from PHP
 * @return {Promise<Record<string, unknown>>} The response
 */
export async function updateSettings(
	updates: Record< string, unknown >,
	jetpackSettings: JetpackNewsletterSettings | undefined
): Promise< Record< string, unknown > > {
	if ( jetpackSettings?.isWpcomSimple && jetpackSettings?.blogID ) {
		return updateSettingsViaWpcomApi( updates, jetpackSettings.blogID );
	}

	// For non-Simple sites, use the standard API
	initializeApi( jetpackSettings );
	return restApi.updateSettings( updates );
}

/**
 * Fetch settings via the WordPress.com REST API.
 * Uses `@wordpress/api-fetch` which handles authentication on Simple sites.
 *
 * @param {number} blogId - The blog ID
 * @return {Promise<Record<string, unknown>>} The settings object
 */
async function fetchSettingsViaWpcomApi( blogId: number ): Promise< Record< string, unknown > > {
	const result = ( await apiFetch( {
		path: `/rest/v1.4/sites/${ blogId }/settings`,
		method: 'GET',
	} ) ) as { settings?: Record< string, unknown > };

	return result.settings || result;
}

/**
 * Update settings via the WordPress.com REST API.
 * Uses apiFetch which handles authentication on Simple sites.
 *
 * @param {Record<string, unknown>} updates - The settings to update
 * @param {number}                  blogId  - The blog ID
 * @return {Promise<Record<string, unknown>>} The response
 */
async function updateSettingsViaWpcomApi(
	updates: Record< string, unknown >,
	blogId: number
): Promise< Record< string, unknown > > {
	const result = ( await apiFetch( {
		path: `/rest/v1.4/sites/${ blogId }/settings`,
		method: 'POST',
		data: updates,
	} ) ) as { updated?: Record< string, unknown > };

	return result.updated || result;
}
