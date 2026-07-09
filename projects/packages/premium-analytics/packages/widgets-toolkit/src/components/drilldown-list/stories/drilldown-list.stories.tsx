/**
 * External dependencies
 */
// The DataViews base stylesheet. The component's scss imports it for product
// builds, but Storybook's Vite/sass pipeline passes css-extension imports
// through verbatim, so the story loads it as a side effect instead.
import '@wordpress/dataviews/build-style/style.css';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { DrilldownList } from '../drilldown-list';
import type { DrilldownListGroup } from '../drilldown-list';
import type { Meta, StoryObj } from '@storybook/react';

const REFERRER_GROUPS: DrilldownListGroup[] = [
	{
		id: 'referrer:search-engines',
		label: 'Search Engines',
		value: 625,
		children: [
			{
				id: 'referrer:google',
				label: 'Google',
				value: 485,
				href: 'https://www.google.com/',
			},
			{
				id: 'referrer:bing',
				label: 'Bing',
				value: 86,
				href: 'https://www.bing.com/',
			},
			{
				id: 'referrer:duckduckgo',
				label: 'DuckDuckGo',
				value: 39,
				href: 'https://duckduckgo.com/',
			},
			{
				id: 'referrer:yahoo',
				label: 'Yahoo',
				value: 14,
				href: 'https://www.yahoo.com/',
			},
		],
	},
	{
		id: 'referrer:social',
		label: 'Social',
		value: 345,
		children: [
			{
				id: 'referrer:facebook',
				label: 'Facebook',
				value: 219,
				href: 'https://www.facebook.com/',
			},
			{
				id: 'referrer:linkedin',
				label: 'LinkedIn',
				value: 126,
				href: 'https://www.linkedin.com/',
			},
		],
	},
	{
		id: 'referrer:direct',
		label: 'Direct',
		value: 251,
		children: [],
	},
];

const REFERRER_FILTER_ELEMENTS = [
	{
		value: 'organic',
		label: __( 'Organic', 'jetpack-premium-analytics' ),
	},
	{
		value: 'social',
		label: __( 'Social', 'jetpack-premium-analytics' ),
	},
	{
		value: 'direct',
		label: __( 'Direct', 'jetpack-premium-analytics' ),
	},
];

const ARCHIVE_GROUPS: DrilldownListGroup[] = [
	{
		id: 'archive:tags',
		label: 'Tags',
		value: 44,
		children: [
			{
				id: 'archive:tags:/tag/performance',
				label: '/tag/performance',
				value: 18,
				href: 'https://example.com/tag/performance/',
			},
			{
				id: 'archive:tags:/tag/analytics',
				label: '/tag/analytics',
				value: 12,
				href: 'https://example.com/tag/analytics/',
			},
			{
				id: 'archive:tags:/tag/jetpack',
				label: '/tag/jetpack',
				value: 8,
				href: 'https://example.com/tag/jetpack/',
			},
			{
				id: 'archive:tags:/tag/wordpress',
				label: '/tag/wordpress',
				value: 6,
				href: 'https://example.com/tag/wordpress/',
			},
		],
	},
	{
		id: 'archive:categories',
		label: 'Categories',
		value: 33,
		children: [
			{
				id: 'archive:categories:/category/news',
				label: '/category/news',
				value: 21,
				href: 'https://example.com/category/news/',
			},
			{
				id: 'archive:categories:/category/reviews',
				label: '/category/reviews',
				value: 12,
				href: 'https://example.com/category/reviews/',
			},
		],
	},
	{
		id: 'archive:dates',
		label: 'Dates',
		value: 7,
		children: [
			{
				id: 'archive:dates:/2026/06',
				label: '/2026/06',
				value: 4,
				href: 'https://example.com/2026/06/',
			},
			{
				id: 'archive:dates:/2026/05',
				label: '/2026/05',
				value: 3,
				href: 'https://example.com/2026/05/',
			},
		],
	},
];

/**
 * Resolve the referrer group type for the DataViews filter.
 *
 * @param group - The referrer drilldown group.
 * @return The group filter value.
 */
function getReferrerGroupFilterValue( group: DrilldownListGroup ): string {
	if ( group.id === 'referrer:social' ) {
		return 'social';
	}

	if ( group.id === 'referrer:direct' ) {
		return 'direct';
	}

	return 'organic';
}

const meta: Meta< typeof DrilldownList > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/DrilldownList',
	component: DrilldownList,
	tags: [ 'autodocs' ],
	argTypes: {
		labelHeader: { control: 'text' },
		valueHeader: { control: 'text' },
	},
	args: {
		groups: REFERRER_GROUPS,
		labelHeader: __( 'Referrer', 'jetpack-premium-analytics' ),
		valueHeader: __( 'Views', 'jetpack-premium-analytics' ),
		searchLabel: __( 'Search referrers', 'jetpack-premium-analytics' ),
		filterElements: REFERRER_FILTER_ELEMENTS,
		getGroupFilterValue: getReferrerGroupFilterValue,
	},
};

export default meta;

type Story = StoryObj< typeof DrilldownList >;

/**
 * Default drilldown list.
 */
export const Default: Story = {};

/**
 * Loading state.
 */
export const Loading: Story = {
	args: {
		isLoading: true,
	},
};

/**
 * Empty state.
 */
export const Empty: Story = {
	args: {
		groups: [],
		emptyLabel: __( 'No referrers found.', 'jetpack-premium-analytics' ),
	},
};

/**
 * Default expanded group state.
 */
export const DefaultExpanded: Story = {
	args: {
		defaultExpandedIds: [ 'referrer:search-engines' ],
	},
};

/**
 * Archive-style reuse with archive page labels.
 */
export const Archives: Story = {
	args: {
		groups: ARCHIVE_GROUPS,
		labelHeader: __( 'Archive pages', 'jetpack-premium-analytics' ),
		valueHeader: __( 'Views', 'jetpack-premium-analytics' ),
		searchLabel: __( 'Search archives', 'jetpack-premium-analytics' ),
		emptyLabel: __( 'No archives found.', 'jetpack-premium-analytics' ),
		defaultExpandedIds: [ 'archive:tags' ],
		filterElements: undefined,
		getGroupFilterValue: undefined,
	},
};
