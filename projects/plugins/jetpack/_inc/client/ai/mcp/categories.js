/**
 * MCP Tools Category Mapping.
 *
 * Ported from client/dashboard/me/mcp/categories.ts in wp-calypso.
 * Maps API category values to display categories and sub-categories for the MCP settings page.
 */

import { __ } from '@wordpress/i18n';

export const DISPLAY_CATEGORIES = {
	POSTS: __( 'Posts', 'jetpack' ),
	PAGES: __( 'Pages', 'jetpack' ),
	DESIGN: __( 'Design', 'jetpack' ),
	SITES: __( 'Sites', 'jetpack' ),
	ACCOUNT: __( 'Account', 'jetpack' ),
	DOMAINS: __( 'Domains', 'jetpack' ),
	DEVELOPER_TESTING: __( 'Developer & testing', 'jetpack' ),
	UNCATEGORIZED: __( 'Uncategorized', 'jetpack' ),
};

export const CATEGORY_ORDER = [
	DISPLAY_CATEGORIES.SITES,
	DISPLAY_CATEGORIES.POSTS,
	DISPLAY_CATEGORIES.PAGES,
	DISPLAY_CATEGORIES.DESIGN,
	DISPLAY_CATEGORIES.DOMAINS,
	DISPLAY_CATEGORIES.ACCOUNT,
	DISPLAY_CATEGORIES.DEVELOPER_TESTING,
	DISPLAY_CATEGORIES.UNCATEGORIZED,
];

const SUB_CATEGORIES = {
	POSTS: __( 'Posts', 'jetpack' ),
	COMMENTS: __( 'Comments', 'jetpack' ),
	CATEGORIES_TAGS: __( 'Categories & tags', 'jetpack' ),
	SITES: __( 'Sites', 'jetpack' ),
	MEDIA: __( 'Media', 'jetpack' ),
	SITE_SETTINGS: __( 'Site settings', 'jetpack' ),
	ANALYTICS: __( 'Analytics', 'jetpack' ),
	ACCOUNT: __( 'Account', 'jetpack' ),
	NOTIFICATIONS: __( 'Notifications', 'jetpack' ),
};

export const SUB_CATEGORY_ORDER = {
	[ DISPLAY_CATEGORIES.POSTS ]: [
		SUB_CATEGORIES.POSTS,
		SUB_CATEGORIES.COMMENTS,
		SUB_CATEGORIES.CATEGORIES_TAGS,
	],
	[ DISPLAY_CATEGORIES.SITES ]: [
		SUB_CATEGORIES.SITES,
		SUB_CATEGORIES.SITE_SETTINGS,
		SUB_CATEGORIES.MEDIA,
		SUB_CATEGORIES.ANALYTICS,
	],
	[ DISPLAY_CATEGORIES.ACCOUNT ]: [ SUB_CATEGORIES.ACCOUNT, SUB_CATEGORIES.NOTIFICATIONS ],
};

const API_CATEGORY_TO_DISPLAY = {
	posts: DISPLAY_CATEGORIES.POSTS,
	comments: DISPLAY_CATEGORIES.POSTS,
	'categories-tags': DISPLAY_CATEGORIES.POSTS,
	pages: DISPLAY_CATEGORIES.PAGES,
	design: DISPLAY_CATEGORIES.DESIGN,
	sites: DISPLAY_CATEGORIES.SITES,
	media: DISPLAY_CATEGORIES.SITES,
	users: DISPLAY_CATEGORIES.SITES,
	plugins: DISPLAY_CATEGORIES.SITES,
	'site-settings': DISPLAY_CATEGORIES.SITES,
	analytics: DISPLAY_CATEGORIES.SITES,
	account: DISPLAY_CATEGORIES.ACCOUNT,
	notifications: DISPLAY_CATEGORIES.ACCOUNT,
	billing: DISPLAY_CATEGORIES.ACCOUNT,
	domains: DISPLAY_CATEGORIES.DOMAINS,
	'developer-testing': DISPLAY_CATEGORIES.DEVELOPER_TESTING,
};

const API_CATEGORY_TO_SUB_CATEGORY = {
	posts: SUB_CATEGORIES.POSTS,
	comments: SUB_CATEGORIES.COMMENTS,
	'categories-tags': SUB_CATEGORIES.CATEGORIES_TAGS,
	sites: SUB_CATEGORIES.SITES,
	media: SUB_CATEGORIES.MEDIA,
	users: SUB_CATEGORIES.SITE_SETTINGS,
	plugins: SUB_CATEGORIES.SITE_SETTINGS,
	'site-settings': SUB_CATEGORIES.SITE_SETTINGS,
	analytics: SUB_CATEGORIES.ANALYTICS,
	account: SUB_CATEGORIES.ACCOUNT,
	notifications: SUB_CATEGORIES.NOTIFICATIONS,
	billing: SUB_CATEGORIES.ACCOUNT,
};

/**
 * Get the display sub-category name for a tool.
 *
 * @param {string} toolId  - Tool identifier.
 * @param {object} ability - Tool descriptor from the API.
 * @return {string | undefined} Sub-category display name, or undefined if none.
 */
export function getSubCategory( toolId, ability ) {
	const apiCategory = ability?.category;
	if ( apiCategory ) {
		return API_CATEGORY_TO_SUB_CATEGORY[ apiCategory ];
	}
	return undefined;
}

/**
 * Check whether a tool is a write (non-readonly) tool.
 *
 * @param {string} toolId  - Tool identifier.
 * @param {object} ability - Tool descriptor from the API.
 * @return {boolean} True if the tool is a write tool.
 */
export function isWriteTool( toolId, ability ) {
	return ability?.readonly === false;
}

/**
 * Get the display category name for a tool.
 *
 * @param {string} toolId  - Tool identifier.
 * @param {object} ability - Tool descriptor from the API.
 * @return {string} Display category name, falling back to Uncategorized.
 */
export function getDisplayCategory( toolId, ability ) {
	const apiCategory = ability?.category;
	if ( apiCategory && API_CATEGORY_TO_DISPLAY[ apiCategory ] ) {
		return API_CATEGORY_TO_DISPLAY[ apiCategory ];
	}
	return DISPLAY_CATEGORIES.UNCATEGORIZED;
}

/**
 * Pass-through sort — preserved for interface compatibility.
 *
 * @param {Array} tools - Tool entries to sort.
 * @return {Array} The same tool entries, unchanged.
 */
export function sortTools( tools ) {
	return tools;
}
