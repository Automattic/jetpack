/**
 * API utilities for newsletter settings
 *
 * On WordPress.com Simple sites, the Jetpack REST API is not directly accessible.
 * Instead, we use the WordPress.com REST API endpoint via `@wordpress/api-fetch`:
 * /rest/v1.4/sites/{SITE_ID}/settings
 */

import restApi from '@automattic/jetpack-api';
import { getSiteData, isSimpleSite } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { decodeEntities } from '@wordpress/html-entities';

let apiInitialized = false;

/**
 * Initialize the REST API with data from JetpackScriptData.
 * Only needed for non-Simple sites. Call this before making API requests.
 */
export function initializeApi(): void {
	if ( apiInitialized || isSimpleSite() ) {
		return;
	}

	const siteData = getSiteData();
	if ( siteData?.rest_root && siteData?.rest_nonce ) {
		restApi.setApiRoot( siteData.rest_root );
		restApi.setApiNonce( siteData.rest_nonce );
		apiInitialized = true;
	}
}

/**
 * Get the blog ID from JetpackScriptData.
 *
 * @return {number} The blog ID
 */
function getBlogId(): number {
	return getSiteData()?.wpcom?.blog_id ?? 0;
}

/**
 * Fetch settings from the Jetpack REST API.
 * On Simple sites, uses the WordPress.com REST API.
 *
 * @return {Promise<Record<string, unknown>>} The settings object
 */
export async function fetchSettings(): Promise< Record< string, unknown > > {
	const blogId = getBlogId();
	if ( isSimpleSite() && blogId ) {
		return fetchSettingsViaWpcomApi( blogId );
	}

	// For non-Simple sites, use the standard API
	initializeApi();
	return restApi.fetchSettings();
}

/**
 * Update settings via the Jetpack REST API.
 * On Simple sites, uses the WordPress.com REST API.
 *
 * @param {Record<string, unknown>} updates - The settings to update
 * @return {Promise<Record<string, unknown>>} The response
 */
export async function updateSettings(
	updates: Record< string, unknown >
): Promise< Record< string, unknown > > {
	const blogId = getBlogId();
	if ( isSimpleSite() && blogId ) {
		return updateSettingsViaWpcomApi( updates, blogId );
	}

	// For non-Simple sites, use the standard API
	initializeApi();
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
 * The site's title and tagline — `blogname` and `blogdescription`, the same two
 * options Settings → General edits.
 */
export interface SiteIdentity {
	title: string;
	description: string;
}

/**
 * Normalize a title/tagline pair coming back from either API.
 *
 * WordPress stores both through `sanitize_option()`, which HTML-escapes them —
 * so "Ben & Jerry's" comes back as `Ben &amp; Jerry&#039;s`. Left alone it
 * renders as literal entities in the field, and re-saving would escape it
 * again. (The AI Launchpad hit the same thing; see its `js/app.tsx`.)
 *
 * @param title       - Raw title from the API.
 * @param description - Raw tagline from the API.
 * @return The decoded pair.
 */
function normalizeIdentity( title: unknown, description: unknown ): SiteIdentity {
	return {
		title: decodeEntities( String( title ?? '' ) ),
		description: decodeEntities( String( description ?? '' ) ),
	};
}

/**
 * Fetch the site title and tagline.
 *
 * These are core options rather than Jetpack settings, so they don't ride along
 * with {@link fetchSettings}: `jetpack/v4/settings` only accepts the options on
 * its own allowlist, and `blogname` isn't one of them. Simple sites read them
 * from the WordPress.com site settings endpoint that already backs this page;
 * everywhere else uses core's own settings route.
 *
 * @return The site's title and tagline.
 */
export async function fetchSiteIdentity(): Promise< SiteIdentity > {
	const blogId = getBlogId();

	if ( isSimpleSite() && blogId ) {
		const settings = await fetchSettingsViaWpcomApi( blogId );

		return normalizeIdentity( settings.blogname, settings.blogdescription );
	}

	const result = ( await apiFetch( { path: '/wp/v2/settings', method: 'GET' } ) ) as {
		title?: string;
		description?: string;
	};

	return normalizeIdentity( result.title, result.description );
}

/**
 * Save the site title and tagline. Only the keys present are written, so a
 * section that changed one field doesn't rewrite the other.
 *
 * Resolves to the full stored pair, so callers can replace their state with it
 * rather than reconciling field by field.
 *
 * @param updates - The fields to write.
 * @return The site's title and tagline as WordPress now stores them.
 */
export async function updateSiteIdentity(
	updates: Partial< SiteIdentity >
): Promise< SiteIdentity > {
	const blogId = getBlogId();

	if ( isSimpleSite() && blogId ) {
		const data: Record< string, unknown > = {};
		if ( updates.title !== undefined ) {
			data.blogname = updates.title;
		}
		if ( updates.description !== undefined ) {
			data.blogdescription = updates.description;
		}

		await updateSettingsViaWpcomApi( data, blogId );

		// Read back rather than trusting what the write returned. That endpoint
		// reports the value it was handed, not the one it stored, and it omits a
		// key altogether when sanitizing produced what was already there — so its
		// response is neither canonical nor complete. The extra GET only happens
		// on a manual save of this one card.
		const settings = await fetchSettingsViaWpcomApi( blogId );

		return normalizeIdentity( settings.blogname, settings.blogdescription );
	}

	const data: Record< string, unknown > = {};
	if ( updates.title !== undefined ) {
		data.title = updates.title;
	}
	if ( updates.description !== undefined ) {
		data.description = updates.description;
	}

	const result = ( await apiFetch( {
		path: '/wp/v2/settings',
		method: 'POST',
		data,
	} ) ) as { title?: string; description?: string };

	// Core's settings route answers a write with the full, freshly-read settings
	// object, so no follow-up read is needed here.
	return normalizeIdentity( result.title, result.description );
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
 * @return {Promise<Category[]>} Array of categories
 */
export async function fetchCategories(): Promise< Category[] > {
	const blogId = getBlogId();
	if ( isSimpleSite() && blogId ) {
		return fetchCategoriesViaWpcomApi( blogId );
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

/**
 * Create a new category via the WordPress REST API (`/wp/v2/categories`).
 *
 * This endpoint works on both self-hosted and WordPress.com Simple sites — in the
 * wp-admin context the request is proxied to WordPress.com — and, crucially, it
 * returns errors in the standard WP-REST shape (`{ code: 'term_exists', … }`)
 * that `@wordpress/api-fetch` parses natively. The older
 * `/rest/v1.1/…/taxonomies/category/terms/new` endpoint returns wpcom-format
 * errors (`{ error: 'duplicate' }`) that apiFetch can't parse, so it collapses
 * them to a generic `unknown_error` and the duplicate signal is lost before we
 * can read it — hence we use `/wp/v2/categories` everywhere here.
 *
 * @param {string} name - The name of the category to create.
 * @return {Promise<Category>} The created category.
 */
export async function createCategory( name: string ): Promise< Category > {
	const category = await createCategoryViaWpApi( name );

	// Guard against an unexpected success payload: without a numeric id the caller
	// would select a bogus token (e.g. `String( undefined )`). Surface it as a
	// normal failure instead.
	if ( typeof category.id !== 'number' || ! Number.isFinite( category.id ) ) {
		throw new Error( 'Unexpected response while creating the category.' );
	}

	return category;
}

/**
 * Create a category via the WordPress REST API.
 *
 * @param {string} name - The name of the category to create.
 * @return {Promise<Category>} The created category.
 */
async function createCategoryViaWpApi( name: string ): Promise< Category > {
	const category = ( await apiFetch( {
		path: '/wp/v2/categories',
		method: 'POST',
		data: { name },
	} ) ) as { id: number; name: string };

	return { id: category.id, name: category.name };
}
