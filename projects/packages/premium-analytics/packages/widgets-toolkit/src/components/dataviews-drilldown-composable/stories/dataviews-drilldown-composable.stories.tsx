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
import { DataViewsDrilldownComposable } from '../dataviews-drilldown-composable';
import type {
	DataViewsDrilldownComposableChild,
	DataViewsDrilldownComposableColumn,
	DataViewsDrilldownComposableGroup,
} from '../dataviews-drilldown-composable';
import type { Meta, StoryObj } from '@storybook/react';

type ReferrerChild = DataViewsDrilldownComposableChild & {
	date: string;
};

type ReferrerGroup = Omit< DataViewsDrilldownComposableGroup, 'children' > & {
	medium: string;
	children: ReferrerChild[];
};

const REFERRER_GROUPS: ReferrerGroup[] = [
	{
		id: 'referrer:search-engines',
		label: 'Search Engines',
		value: 625,
		medium: 'organic',
		children: [
			{
				id: 'referrer:google',
				label: 'Google',
				value: 485,
				date: '2026-06-30',
				href: 'https://google.com',
			},
			{
				id: 'referrer:bing',
				label: 'Bing',
				value: 86,
				date: '2026-06-29',
				href: 'https://bing.com',
			},
			{
				id: 'referrer:duckduckgo',
				label: 'DuckDuckGo',
				value: 39,
				date: '2026-06-28',
				href: 'https://duckduckgo.com',
			},
			{
				id: 'referrer:yahoo',
				label: 'Yahoo',
				value: 14,
				date: '2026-06-27',
				href: 'https://yahoo.com',
			},
		],
	},
	{
		id: 'referrer:social',
		label: 'Social',
		value: 345,
		medium: 'social',
		children: [
			{
				id: 'referrer:facebook',
				label: 'Facebook',
				value: 210,
				date: '2026-06-26',
				href: 'https://facebook.com',
			},
			{
				id: 'referrer:x',
				label: 'X',
				value: 135,
				date: '2026-06-25',
				href: 'https://x.com',
			},
		],
	},
	{
		id: 'referrer:direct',
		label: 'Direct',
		value: 251,
		medium: 'direct',
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

const ARCHIVE_GROUPS: DataViewsDrilldownComposableGroup[] = [
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
 * Build one child source for the paginated referrer story.
 *
 * @param index - The 1-based child index.
 * @return The paginated story child.
 */
function getPaginatedChild( index: number ): DataViewsDrilldownComposableChild {
	const paddedIndex = String( index ).padStart( 2, '0' );

	return {
		id: `referrer:01:source:${ paddedIndex }`,
		label: `Referrer 01 / Source ${ paddedIndex }`,
		value: 16 - index,
	};
}

/**
 * Build one group for the paginated referrer story.
 *
 * @param index - The 1-based group index.
 * @return The paginated story group.
 */
function getPaginatedGroup( index: number ): DataViewsDrilldownComposableGroup {
	const paddedIndex = String( index ).padStart( 2, '0' );
	const children: DataViewsDrilldownComposableChild[] = [];

	if ( index === 1 ) {
		for ( let childIndex = 1; childIndex <= 15; childIndex++ ) {
			children.push( getPaginatedChild( childIndex ) );
		}
	}

	return {
		id: `referrer:${ paddedIndex }`,
		label: `Referrer ${ paddedIndex }`,
		value: 130 - index * 10,
		children,
	};
}

const PAGINATED_GROUPS: DataViewsDrilldownComposableGroup[] = Array.from(
	{ length: 12 },
	( _, index ) => getPaginatedGroup( index + 1 )
);

/**
 * Resolve the referrer group type for the DataViews filter.
 *
 * @param group - The referrer drilldown group.
 * @return The group filter value.
 */
function getReferrerGroupFilterValue( group: DataViewsDrilldownComposableGroup ): string {
	if ( 'medium' in group && typeof group.medium === 'string' ) {
		return group.medium;
	}

	return 'organic';
}

/**
 * Whether a referrer row has a story-only date.
 *
 * @param row - The drilldown row.
 * @return Whether the row has a date value.
 */
function hasReferrerDate(
	row: DataViewsDrilldownComposableGroup | DataViewsDrilldownComposableChild
): row is ReferrerChild {
	return 'date' in row;
}

/**
 * Format a date string for display in the multi-column story.
 *
 * @param date - The ISO date string.
 * @return The formatted date.
 */
function formatReferrerDate( date: string ): string {
	const [ year, month, day ] = date.split( '-' ).map( Number );

	return new Date( year, month - 1, day ).toLocaleDateString( undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	} );
}

/**
 * Read the optional referrer date column value.
 *
 * @param row - The referrer row.
 * @return The formatted date, or blank for groups.
 */
function getReferrerDateValue(
	row: DataViewsDrilldownComposableGroup | DataViewsDrilldownComposableChild
): string {
	if ( hasReferrerDate( row ) ) {
		return formatReferrerDate( row.date );
	}

	return '';
}

/**
 * Read the formatted referrer views column value.
 *
 * @param row - The referrer row.
 * @return The formatted views.
 */
function getReferrerViewsValue(
	row: DataViewsDrilldownComposableGroup | DataViewsDrilldownComposableChild
): string {
	return row.value.toLocaleString();
}

const REFERRER_COLUMNS: DataViewsDrilldownComposableColumn[] = [
	{
		id: 'date',
		header: __( 'Date', 'jetpack-premium-analytics' ),
		getValue: getReferrerDateValue,
	},
	{
		id: 'views',
		header: __( 'Views', 'jetpack-premium-analytics' ),
		getValue: getReferrerViewsValue,
	},
];

const meta: Meta< typeof DataViewsDrilldownComposable > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/DataViewsDrilldownComposable',
	component: DataViewsDrilldownComposable,
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

type Story = StoryObj< typeof DataViewsDrilldownComposable >;

/**
 * Default drilldown list.
 */
export const Default: Story = {};

/**
 * Referrer list with additional value columns.
 */
export const MultipleColumns: Story = {
	args: {
		columns: REFERRER_COLUMNS,
		defaultExpandedIds: [ 'referrer:search-engines' ],
	},
};

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

/**
 * Paginated group list with expanded children.
 */
export const Paginated: Story = {
	args: {
		groups: PAGINATED_GROUPS,
		defaultExpandedIds: [ 'referrer:01' ],
		filterElements: undefined,
		getGroupFilterValue: undefined,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Pagination counts groups; an expanded group's children always render with their group and never split across pages.",
			},
		},
	},
};
