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

	const settings = result.settings || result;

	// WordPress.com Simple sites don't return a `subscriptions` key,
	// but subscriptions are always enabled on Simple sites.
	return { subscriptions: true, ...settings };
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

/**
 * Category type used by the API.
 */
export interface Category {
	id: number;
	name: string;
}

/**
 * Fetch all categories, handling pagination.
 * On Simple sites, uses the WordPress.com REST API.
 *
 * @param {JetpackNewsletterSettings} jetpackSettings - Settings from PHP
 * @return {Promise<Category[]>} Array of categories
 */
export async function fetchCategories(
	jetpackSettings: JetpackNewsletterSettings | undefined
): Promise< Category[] > {
	if ( jetpackSettings?.isWpcomSimple && jetpackSettings?.blogID ) {
		return fetchCategoriesViaWpcomApi( jetpackSettings.blogID );
	}

	return fetchCategoriesViaWpApi();
}

/**
 * Fetch categories via the WordPress.com REST API.
 * Uses `@wordpress/api-fetch` which handles authentication on Simple sites.
 *
 * @param {number} blogId - The blog ID
 * @return {Promise<Category[]>} Array of categories
 */
async function fetchCategoriesViaWpcomApi( blogId: number ): Promise< Category[] > {
	const allCategories: Category[] = [];
	let page = 1;
	let hasMore = true;

	while ( hasMore ) {
		const result = ( await apiFetch( {
			path: `/rest/v1.1/sites/${ blogId }/taxonomies/category/terms?page=${ page }&number=100`,
			method: 'GET',
		} ) ) as { terms?: Array< { ID: number; name: string } >; found?: number };

		const terms = result.terms || [];
		// WordPress.com API returns ID (uppercase), normalize to id (lowercase)
		allCategories.push( ...terms.map( term => ( { id: term.ID, name: term.name } ) ) );

		// Check if there are more pages
		const found = result.found || 0;
		hasMore = allCategories.length < found;
		page++;
	}

	return allCategories;
}

/**
 * Fetch categories via the WordPress REST API.
 * Uses `@wordpress/api-fetch` for consistent handling.
 *
 * @return {Promise<Category[]>} Array of categories
 */
async function fetchCategoriesViaWpApi(): Promise< Category[] > {
	const allCategories: Category[] = [];
	let page = 1;
	let hasMore = true;

	while ( hasMore ) {
		const result = ( await apiFetch( {
			path: `/wp/v2/categories?per_page=100&page=${ page }`,
			method: 'GET',
			parse: false, // Get raw response to access headers
		} ) ) as Response;

		const categories: Category[] = await result.json();
		allCategories.push( ...categories.map( cat => ( { id: cat.id, name: cat.name } ) ) );

		// Check if there are more pages
		const totalPages = parseInt( result.headers.get( 'X-WP-TotalPages' ) || '1', 10 );
		hasMore = page < totalPages;
		page++;
	}

	return allCategories;
}
