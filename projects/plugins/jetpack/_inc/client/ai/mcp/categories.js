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
	// Posts sub-categories
	POSTS: __( 'Posts', 'jetpack' ),
	COMMENTS: __( 'Comments', 'jetpack' ),
	CATEGORIES_TAGS: __( 'Categories & tags', 'jetpack' ),
	// Sites sub-categories
	SITES: __( 'Sites', 'jetpack' ),
	PLUGINS: __( 'Plugins', 'jetpack' ),
	MEDIA: __( 'Media', 'jetpack' ),
	SITE_SETTINGS: __( 'Site settings', 'jetpack' ),
	ANALYTICS: __( 'Analytics', 'jetpack' ),
	// Account sub-categories
	ACCOUNT: __( 'Account', 'jetpack' ),
	NOTIFICATIONS: __( 'Notifications', 'jetpack' ),
	// Design sub-categories
	THEMES: __( 'Themes', 'jetpack' ),
	PATTERNS: __( 'Patterns', 'jetpack' ),
	TEMPLATES: __( 'Templates', 'jetpack' ),
	GLOBAL_STYLES: __( 'Global styles', 'jetpack' ),
	NAVIGATION: __( 'Navigation', 'jetpack' ),
	BLOCKS: __( 'Blocks', 'jetpack' ),
};

export const SUB_CATEGORY_ORDER = {
	[ DISPLAY_CATEGORIES.POSTS ]: [
		SUB_CATEGORIES.POSTS,
		SUB_CATEGORIES.COMMENTS,
		SUB_CATEGORIES.CATEGORIES_TAGS,
	],
	[ DISPLAY_CATEGORIES.SITES ]: [
		SUB_CATEGORIES.SITES,
		SUB_CATEGORIES.PLUGINS,
		SUB_CATEGORIES.SITE_SETTINGS,
		SUB_CATEGORIES.MEDIA,
		SUB_CATEGORIES.ANALYTICS,
	],
	[ DISPLAY_CATEGORIES.ACCOUNT ]: [ SUB_CATEGORIES.ACCOUNT, SUB_CATEGORIES.NOTIFICATIONS ],
	[ DISPLAY_CATEGORIES.DESIGN ]: [
		SUB_CATEGORIES.THEMES,
		SUB_CATEGORIES.PATTERNS,
		SUB_CATEGORIES.TEMPLATES,
		SUB_CATEGORIES.GLOBAL_STYLES,
		SUB_CATEGORIES.NAVIGATION,
		SUB_CATEGORIES.BLOCKS,
	],
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
	'wpcom-mcp': DISPLAY_CATEGORIES.DEVELOPER_TESTING,
	'developer-testing': DISPLAY_CATEGORIES.DEVELOPER_TESTING,
};

const API_CATEGORY_TO_SUB_CATEGORY = {
	// Posts card sub-categories
	posts: SUB_CATEGORIES.POSTS,
	comments: SUB_CATEGORIES.COMMENTS,
	'categories-tags': SUB_CATEGORIES.CATEGORIES_TAGS,
	// Sites card sub-categories
	sites: SUB_CATEGORIES.SITES,
	media: SUB_CATEGORIES.MEDIA,
	users: SUB_CATEGORIES.SITE_SETTINGS,
	plugins: SUB_CATEGORIES.PLUGINS,
	'site-settings': SUB_CATEGORIES.SITE_SETTINGS,
	analytics: SUB_CATEGORIES.ANALYTICS,
	// Account card sub-categories
	account: SUB_CATEGORIES.ACCOUNT,
	notifications: SUB_CATEGORIES.NOTIFICATIONS,
	billing: SUB_CATEGORIES.ACCOUNT,
};

// Design-card tools all share `design` as their API category, so sub-groups within the
// Design card are derived from tool ID prefixes. This also covers `sites`-category tools
// that are routed to the Design card (navigation, menus, themes).
const TOOL_ID_PREFIX_TO_DESIGN_SUB_CATEGORY = {
	'wpcom-mcp/theme-': SUB_CATEGORIES.THEMES,
	'wpcom-mcp/themes-': SUB_CATEGORIES.THEMES,
	'wpcom-mcp/patterns-': SUB_CATEGORIES.PATTERNS,
	'wpcom-mcp/synced-patterns-': SUB_CATEGORIES.PATTERNS,
	'wpcom-mcp/templates-': SUB_CATEGORIES.TEMPLATES,
	'wpcom-mcp/template-parts-': SUB_CATEGORIES.TEMPLATES,
	'wpcom-mcp/global-styles-': SUB_CATEGORIES.GLOBAL_STYLES,
	'wpcom-mcp/navigation-': SUB_CATEGORIES.NAVIGATION,
	'wpcom-mcp/menus-': SUB_CATEGORIES.NAVIGATION,
	'wpcom-mcp/menu-items-': SUB_CATEGORIES.NAVIGATION,
	'wpcom-mcp/blocks-': SUB_CATEGORIES.BLOCKS,
};

const DEVELOPER_TESTING_TOOL_IDS = new Set( [
	'jetpack/search-voice',
	'jetpack-search-voice',
	'wpcom-mcp/jetpack-search-voice',
	'wpcom-mcp-jetpack-search-voice',
] );

/**
 * Get the display sub-category name for a tool.
 *
 * @param {string} toolId  - Tool identifier.
 * @param {object} ability - Tool descriptor from the API.
 * @return {string | undefined} Sub-category display name, or undefined if none.
 */
export function getSubCategory( toolId, ability ) {
	const apiCategory = ability?.category;

	// Design-card tools use tool ID prefix for sub-grouping. This covers both
	// 'design'-category tools and 'sites'-category tools that are routed to the
	// Design card by getDisplayCategory (e.g. navigation, menus, themes).
	if ( apiCategory === 'design' || apiCategory === 'sites' ) {
		for ( const [ prefix, subCategory ] of Object.entries(
			TOOL_ID_PREFIX_TO_DESIGN_SUB_CATEGORY
		) ) {
			if ( toolId.startsWith( prefix ) ) {
				return subCategory;
			}
		}
		// Tools in these API categories should still be rendered even when their
		// IDs do not match a known Design prefix, so fall back to the category's
		// default sub-category instead of returning undefined.
		return API_CATEGORY_TO_SUB_CATEGORY[ apiCategory ];
	}

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
 * For 'design' and 'sites' category tools, check if the tool ID prefix indicates
 * it belongs in the Design card (navigation, menus, themes mirror calypso's approach).
 *
 * @param {string} toolId  - Tool identifier.
 * @param {object} ability - Tool descriptor from the API.
 * @return {string} Display category name, falling back to Uncategorized.
 */
export function getDisplayCategory( toolId, ability ) {
	if (
		DEVELOPER_TESTING_TOOL_IDS.has( toolId ) ||
		DEVELOPER_TESTING_TOOL_IDS.has( ability?.name )
	) {
		return DISPLAY_CATEGORIES.DEVELOPER_TESTING;
	}

	const apiCategory = ability?.category;

	if ( apiCategory === 'design' || apiCategory === 'sites' ) {
		for ( const prefix of Object.keys( TOOL_ID_PREFIX_TO_DESIGN_SUB_CATEGORY ) ) {
			if ( toolId.startsWith( prefix ) ) {
				return DISPLAY_CATEGORIES.DESIGN;
			}
		}
	}

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
