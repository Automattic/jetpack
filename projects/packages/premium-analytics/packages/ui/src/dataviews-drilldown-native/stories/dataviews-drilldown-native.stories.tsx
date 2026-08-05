import { DataViewsDrilldownNative } from '../dataviews-drilldown-native';
import type { DataViewRenderFieldProps, Field } from '@jetpack-premium-analytics/externals';
import type { Meta, StoryObj } from '@storybook/react';

type ReferrerRow = {
	id: string;
	parentId?: string;
	referrer: string;
	date?: string;
	medium?: 'organic' | 'social' | 'direct';
	href?: string;
	views: number;
};

type ArchiveRow = {
	id: string;
	parentId?: string;
	title: string;
	href?: string;
	views: number;
};

const rows: ReferrerRow[] = [
	{ id: 'search', referrer: 'Search Engines', medium: 'organic', views: 625 },
	{
		id: 'google',
		parentId: 'search',
		referrer: 'Google',
		date: '2026-06-30',
		href: 'https://google.com',
		views: 485,
	},
	{
		id: 'google-search',
		parentId: 'google',
		referrer: 'Google Search',
		date: '2026-06-30',
		href: 'https://google.com/search',
		views: 420,
	},
	{
		id: 'google-images',
		parentId: 'google',
		referrer: 'Google Images',
		date: '2026-06-30',
		href: 'https://images.google.com',
		views: 65,
	},
	{
		id: 'bing',
		parentId: 'search',
		referrer: 'Bing',
		date: '2026-06-29',
		href: 'https://bing.com',
		views: 86,
	},
	{
		id: 'duckduckgo',
		parentId: 'search',
		referrer: 'DuckDuckGo',
		date: '2026-06-28',
		href: 'https://duckduckgo.com',
		views: 39,
	},
	{
		id: 'yahoo',
		parentId: 'search',
		referrer: 'Yahoo',
		date: '2026-06-27',
		href: 'https://yahoo.com',
		views: 14,
	},
	{ id: 'social', referrer: 'Social', medium: 'social', views: 345 },
	{
		id: 'facebook',
		parentId: 'social',
		referrer: 'Facebook',
		date: '2026-06-26',
		href: 'https://facebook.com',
		views: 210,
	},
	{
		id: 'x',
		parentId: 'social',
		referrer: 'X',
		date: '2026-06-25',
		href: 'https://x.com',
		views: 135,
	},
	{
		id: 'direct',
		referrer: 'Direct',
		medium: 'direct',
		views: 251,
	},
];

const archiveRows: ArchiveRow[] = [
	{ id: 'tags', title: 'Tags (44)', views: 44 },
	{
		id: 'tag-performance',
		parentId: 'tags',
		title: '/tag/performance',
		href: 'https://example.com/tag/performance',
		views: 18,
	},
	{
		id: 'tag-analytics',
		parentId: 'tags',
		title: '/tag/analytics',
		href: 'https://example.com/tag/analytics',
		views: 12,
	},
	{
		id: 'tag-jetpack',
		parentId: 'tags',
		title: '/tag/jetpack',
		href: 'https://example.com/tag/jetpack',
		views: 8,
	},
	{
		id: 'tag-wordpress',
		parentId: 'tags',
		title: '/tag/wordpress',
		href: 'https://example.com/tag/wordpress',
		views: 6,
	},
	{ id: 'categories', title: 'Categories (33)', views: 33 },
	{
		id: 'category-news',
		parentId: 'categories',
		title: '/category/news',
		href: 'https://example.com/category/news',
		views: 21,
	},
	{
		id: 'category-reviews',
		parentId: 'categories',
		title: '/category/reviews',
		href: 'https://example.com/category/reviews',
		views: 12,
	},
	{ id: 'dates', title: 'Dates (7)', views: 7 },
	{
		id: 'date-2026-06',
		parentId: 'dates',
		title: '/2026/06',
		href: 'https://example.com/2026/06',
		views: 4,
	},
	{
		id: 'date-2026-05',
		parentId: 'dates',
		title: '/2026/05',
		href: 'https://example.com/2026/05',
		views: 3,
	},
];

/**
 * Build paginated referrer rows for the pagination story.
 *
 * @return The paginated referrer rows.
 */
function buildPaginatedRows(): ReferrerRow[] {
	const paginatedRows: ReferrerRow[] = [];

	for ( let index = 1; index <= 12; index++ ) {
		const id = `referrer-${ String( index ).padStart( 2, '0' ) }`;
		const label = `Referrer ${ String( index ).padStart( 2, '0' ) }`;

		paginatedRows.push( {
			id,
			referrer: label,
			views: ( 13 - index ) * 10,
		} );

		if ( index !== 1 ) {
			continue;
		}

		for ( let childIndex = 1; childIndex <= 15; childIndex++ ) {
			paginatedRows.push( {
				id: `${ id }-source-${ String( childIndex ).padStart( 2, '0' ) }`,
				parentId: id,
				referrer: `${ label } / Source ${ String( childIndex ).padStart( 2, '0' ) }`,
				views: 16 - childIndex,
			} );
		}
	}

	return paginatedRows;
}

const PAGINATED_ROWS: ReferrerRow[] = buildPaginatedRows();

const mediumElements = [
	{ value: 'organic', label: 'Organic' },
	{ value: 'social', label: 'Social' },
	{ value: 'direct', label: 'Direct' },
];

/*
 * Cell content is entirely consumer-rendered in DataViews, so styling parent
 * rows differently (bold here) is a plain field `render` concern — no
 * DataViews internals involved.
 */
const referrerParentIds = new Set(
	[ ...rows, ...PAGINATED_ROWS ].map( row => row.parentId ).filter( Boolean )
);

/**
 * Render the referrer field, bolding rows that have children.
 *
 * @param props      - The DataViews render props.
 * @param props.item - The referrer row.
 * @return The rendered referrer.
 */
function ReferrerField( { item }: DataViewRenderFieldProps< ReferrerRow > ): JSX.Element {
	const label = referrerParentIds.has( item.id ) ? (
		<strong>{ item.referrer }</strong>
	) : (
		<>{ item.referrer }</>
	);

	if ( item.href ) {
		return (
			<a href={ item.href } target="_blank" rel="noreferrer">
				{ label }
			</a>
		);
	}

	return label;
}

const archiveParentIds = new Set( archiveRows.map( row => row.parentId ).filter( Boolean ) );

/**
 * Render the archive title field, bolding rows that have children.
 *
 * @param props      - The DataViews render props.
 * @param props.item - The archive row.
 * @return The rendered archive title.
 */
function ArchiveTitleField( { item }: DataViewRenderFieldProps< ArchiveRow > ): JSX.Element {
	const label = archiveParentIds.has( item.id ) ? (
		<strong>{ item.title }</strong>
	) : (
		<>{ item.title }</>
	);

	if ( item.href ) {
		return (
			<a href={ item.href } target="_blank" rel="noreferrer">
				{ label }
			</a>
		);
	}

	return label;
}

/**
 * Format an ISO date for display.
 *
 * @param value - The ISO date value.
 * @return The localized date label.
 */
function formatDate( value: string ): string {
	return new Date( value ).toLocaleDateString( undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	} );
}

/**
 * Render the date field.
 *
 * @param props      - The DataViews render props.
 * @param props.item - The referrer row.
 * @return The rendered date.
 */
function DateField( { item }: DataViewRenderFieldProps< ReferrerRow > ): JSX.Element {
	if ( ! item.date ) {
		return <></>;
	}

	return <>{ formatDate( item.date ) }</>;
}

/**
 * Render the views field.
 *
 * @param props      - The DataViews render props.
 * @param props.item - The referrer row.
 * @return The rendered view count.
 */
function ViewsField( { item }: DataViewRenderFieldProps< ReferrerRow > ): JSX.Element {
	return <>{ item.views.toLocaleString() }</>;
}

/**
 * Render the archive views field.
 *
 * @param props      - The DataViews render props.
 * @param props.item - The archive row.
 * @return The rendered archive view count.
 */
function ArchiveViewsField( { item }: DataViewRenderFieldProps< ArchiveRow > ): JSX.Element {
	return <>{ item.views.toLocaleString() }</>;
}

/**
 * Resolve the stable row id.
 *
 * @param item - The referrer row.
 * @return The row id.
 */
function getItemId( item: ReferrerRow ): string {
	return item.id;
}

/**
 * Resolve the parent id for child rows.
 *
 * @param item - The referrer row.
 * @return The parent row id, if present.
 */
function getItemParentId( item: ReferrerRow ): string | undefined {
	return item.parentId;
}

/**
 * Resolve the stable archive row id.
 *
 * @param item - The archive row.
 * @return The row id.
 */
function getArchiveItemId( item: ArchiveRow ): string {
	return item.id;
}

/**
 * Resolve the parent id for archive child rows.
 *
 * @param item - The archive row.
 * @return The parent row id, if present.
 */
function getArchiveItemParentId( item: ArchiveRow ): string | undefined {
	return item.parentId;
}

const fields: Field< ReferrerRow >[] = [
	{
		id: 'referrer',
		label: 'Referrer',
		enableGlobalSearch: true,
		render: ReferrerField,
	},
	{
		id: 'date',
		label: 'Date',
		render: DateField,
	},
	{
		id: 'views',
		label: 'Views',
		render: ViewsField,
	},
	{
		id: 'medium',
		label: 'Medium',
		elements: mediumElements,
		filterBy: {
			operators: [ 'isAny' ],
		},
	},
];

const layoutStyles = {
	referrer: {
		width: '100%',
	},
	date: {
		align: 'end' as const,
	},
	views: {
		align: 'end' as const,
	},
};

const archiveLayoutStyles = {
	title: {
		width: '100%',
	},
	views: {
		align: 'end' as const,
	},
};

/*
 * No default sort: the sample rows are pre-ordered, and the unsorted view
 * preserves that order. Sorting a field reorders rows within each hierarchy
 * level.
 */
const initialView = {
	fields: [ 'referrer', 'views' ],
	layout: {
		styles: layoutStyles,
	},
};

const multipleColumnsInitialView = {
	fields: [ 'referrer', 'date', 'views' ],
	layout: {
		styles: layoutStyles,
	},
};

const sortedInitialView = {
	sort: { field: 'views', direction: 'desc' as const },
	fields: [ 'referrer', 'views' ],
	layout: {
		styles: layoutStyles,
	},
};

const archiveInitialView = {
	fields: [ 'title', 'views' ],
	layout: {
		styles: archiveLayoutStyles,
	},
};

const archiveFields: Field< ArchiveRow >[] = [
	{
		id: 'title',
		label: 'Title',
		enableGlobalSearch: true,
		render: ArchiveTitleField,
	},
	{
		id: 'views',
		label: 'Views',
		render: ArchiveViewsField,
	},
];

const meta: Meta< typeof DataViewsDrilldownNative< ReferrerRow > > = {
	title: 'Packages/Premium Analytics/UI/DataViewsDrilldownNative',
	component: DataViewsDrilldownNative< ReferrerRow >,
	tags: [ 'autodocs' ],
	argTypes: {
		hideLevelMarkers: { control: 'boolean' },
	},
	args: {
		hideLevelMarkers: false,
	},
};

export default meta;

type Story = StoryObj< typeof DataViewsDrilldownNative< ReferrerRow > >;
type ArchiveStory = StoryObj< typeof DataViewsDrilldownNative< ArchiveRow > >;

export const Default: Story = {
	args: {
		data: rows,
		fields,
		getItemId,
		getItemParentId,
		initialView,
	},
	parameters: {
		docs: {
			description: {
				story:
					"DataViews' native hierarchy rendering: `view.showLevels` plus `getItemLevel`, with levels drawn as em-dash markers on the title field. Search and filter keep matches under their ancestors, and sort orders within each level. The hidden Medium field is filterable so the default DataViews filter control appears next to search.",
			},
		},
	},
};

export const HiddenLevelMarkers: Story = {
	args: {
		...Default.args,
		hideLevelMarkers: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					'The one-line CSS override the native rendering leaves room for: the em-dash marker span is hidden but keeps its layout box, so rows indent by depth with plain whitespace.',
			},
		},
	},
};

export const MultipleColumns: Story = {
	args: {
		...Default.args,
		initialView: multipleColumnsInitialView,
	},
};

export const Search: Story = {
	args: {
		...Default.args,
		initialView: { ...initialView, search: 'Google' },
	},
	parameters: {
		docs: {
			description: {
				story:
					'Search keeps matches under their ancestors instead of orphaning them: searching "Google" surfaces Google, Google Search, and Google Images, still nested under Search Engines. Clear the search to see the full tree.',
			},
		},
	},
};

export const Sorted: Story = {
	args: {
		...Default.args,
		initialView: sortedInitialView,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Sorting orders within each level, not globally: top-level rows sort against each other and children sort within their parent, so the tree stays intact. Sorted by Views (desc) here.',
			},
		},
	},
};

export const Loading: Story = {
	args: {
		...Default.args,
		isLoading: true,
	},
};

export const Empty: Story = {
	args: {
		...Default.args,
		data: [],
		empty: <div>No referrers found.</div>,
	},
};

export const Archives: ArchiveStory = {
	args: {
		data: archiveRows,
		fields: archiveFields,
		getItemId: getArchiveItemId,
		getItemParentId: getArchiveItemParentId,
		initialView: archiveInitialView,
	},
};

export const Paginated: Story = {
	args: {
		...Default.args,
		data: PAGINATED_ROWS,
		hideLevelMarkers: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					'Pagination counts every row and slices the hierarchy-ordered list. Until the parent-on-page-boundary refinement lands, a deep subtree can still span pages (its child rows appear on the next page without their parent).',
			},
		},
	},
};
