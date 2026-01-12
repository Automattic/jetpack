/**
 * WordPress dependencies
 */
import {
	backup,
	shield,
	search,
	commentContent,
	video,
	trendingUp,
	share,
	postContent,
	cog,
	home,
} from '@wordpress/icons';

/**
 * Navigation configuration for the modern Jetpack sidebar.
 * Defines the product hierarchy as outlined in the P2 proposal.
 */
export const navigationConfig = {
	root: {
		id: 'root',
		items: [
			{
				id: 'dashboard',
				label: 'Dashboard',
				icon: home,
				to: '/dashboard',
			},
			{
				id: 'security',
				label: 'Security',
				icon: shield,
				isDrilldown: true,
			},
			{
				id: 'performance',
				label: 'Performance',
				icon: trendingUp,
				isDrilldown: true,
			},
			{
				id: 'growth',
				label: 'Growth',
				icon: share,
				isDrilldown: true,
			},
			{
				id: 'content',
				label: 'Content',
				icon: postContent,
				isDrilldown: true,
			},
			{
				id: 'settings',
				label: 'Settings',
				icon: cog,
				to: '/settings',
			},
		],
	},
	security: {
		id: 'security',
		title: 'Security',
		parentId: 'root',
		items: [
			{
				id: 'backup',
				label: 'Backup',
				icon: backup,
				to: '/security', // Would link to backup-specific page
			},
			{
				id: 'scan',
				label: 'Scan',
				icon: shield,
				to: '/security',
			},
			{
				id: 'protect',
				label: 'Protect',
				icon: shield,
				to: '/security',
			},
		],
	},
	performance: {
		id: 'performance',
		title: 'Performance',
		parentId: 'root',
		items: [
			{
				id: 'boost',
				label: 'Boost',
				icon: trendingUp,
				to: '/performance',
			},
			{
				id: 'search',
				label: 'Search',
				icon: search,
				to: '/performance',
			},
			{
				id: 'videopress',
				label: 'VideoPress',
				icon: video,
				to: '/performance',
			},
		],
	},
	growth: {
		id: 'growth',
		title: 'Growth',
		parentId: 'root',
		items: [
			{
				id: 'social',
				label: 'Social',
				icon: share,
				to: '/sharing',
			},
			{
				id: 'crm',
				label: 'CRM',
				icon: commentContent,
				to: '/traffic',
			},
			{
				id: 'stats',
				label: 'Stats',
				icon: trendingUp,
				to: '/traffic',
			},
		],
	},
	content: {
		id: 'content',
		title: 'Content',
		parentId: 'root',
		items: [
			{
				id: 'forms',
				label: 'Forms',
				icon: postContent,
				isDrilldown: true,
			},
			{
				id: 'newsletter',
				label: 'Newsletter',
				icon: commentContent,
				to: '/newsletter',
			},
		],
	},
	forms: {
		id: 'forms',
		title: 'Forms',
		parentId: 'content',
		items: [
			{
				id: 'forms-all',
				label: 'All Forms',
				to: '/writing', // Placeholder route
			},
			{
				id: 'forms-responses',
				label: 'Responses',
				to: '/writing',
			},
			{
				id: 'forms-integrations',
				label: 'Integrations',
				to: '/writing',
			},
		],
	},
};

/**
 * Get navigation items for a given screen.
 *
 * @param {string} screenId - The screen ID to get items for.
 * @return {object|null} The screen configuration or null if not found.
 */
export function getNavigationScreen( screenId ) {
	return navigationConfig[ screenId ] || null;
}

/**
 * Get the parent screen ID for a given screen.
 *
 * @param {string} screenId - The screen ID.
 * @return {string|null} The parent screen ID or null if root.
 */
export function getParentScreenId( screenId ) {
	const screen = navigationConfig[ screenId ];
	return screen?.parentId || null;
}
