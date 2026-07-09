/**
 * The DataViews base stylesheet. The component's scss imports it for product
 * builds, but Storybook's Vite/sass pipeline passes css-extension imports
 * through verbatim, so the story loads it as a side effect instead.
 */
import '@wordpress/dataviews/build-style/style.css';
import { DataViewsDrilldownTable } from '../dataviews-drilldown-table';
import type { Meta, StoryObj } from '@storybook/react';
import type { DataViewRenderFieldProps, Field } from '@wordpress/dataviews';

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

/**
 * Render the referrer field.
 *
 * @param props      - The DataViews render props.
 * @param props.item - The referrer row.
 * @return The rendered referrer.
 */
function ReferrerField( { item }: DataViewRenderFieldProps< ReferrerRow > ): JSX.Element {
	if ( item.href ) {
		return (
			<a href={ item.href } target="_blank" rel="noreferrer">
				{ item.referrer }
			</a>
		);
	}

	return <>{ item.referrer }</>;
}

/**
 * Render the archive title field.
 *
 * @param props      - The DataViews render props.
 * @param props.item - The archive row.
 * @return The rendered archive title.
 */
function ArchiveTitleField( { item }: DataViewRenderFieldProps< ArchiveRow > ): JSX.Element {
	if ( item.href ) {
		return (
			<a href={ item.href } target="_blank" rel="noreferrer">
				{ item.title }
			</a>
		);
	}

	return <>{ item.title }</>;
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

const initialView = {
	sort: { field: 'views', direction: 'desc' as const },
	fields: [ 'referrer', 'views' ],
	layout: {
		styles: layoutStyles,
	},
};

const multipleColumnsInitialView = {
	sort: { field: 'views', direction: 'desc' as const },
	fields: [ 'referrer', 'date', 'views' ],
	layout: {
		styles: layoutStyles,
	},
};

const archiveInitialView = {
	sort: { field: 'views', direction: 'desc' as const },
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

const meta: Meta< typeof DataViewsDrilldownTable< ReferrerRow > > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/DataViewsDrilldownTable',
	component: DataViewsDrilldownTable< ReferrerRow >,
	tags: [ 'autodocs' ],
};

export default meta;

type Story = StoryObj< typeof DataViewsDrilldownTable< ReferrerRow > >;
type ArchiveStory = StoryObj< typeof DataViewsDrilldownTable< ArchiveRow > >;

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
					'The hidden Medium field is filterable so the default DataViews filter control appears next to search.',
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

export const DefaultExpanded: Story = {
	args: {
		...Default.args,
		defaultExpandedIds: [ 'search' ],
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
		defaultExpandedIds: [ 'referrer-01' ],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Pagination counts parent groups; an expanded group's children always render with their parent and never split across pages.",
			},
		},
	},
};
