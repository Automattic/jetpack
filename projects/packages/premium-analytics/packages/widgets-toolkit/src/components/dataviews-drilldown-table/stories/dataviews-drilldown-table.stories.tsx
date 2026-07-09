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
	views: number;
};

const rows: ReferrerRow[] = [
	{ id: 'search', referrer: 'Search Engines', medium: 'organic', views: 625 },
	{
		id: 'google',
		parentId: 'search',
		referrer: 'Google',
		date: '2026-06-30',
		views: 485,
	},
	{
		id: 'bing',
		parentId: 'search',
		referrer: 'Bing',
		date: '2026-06-29',
		views: 86,
	},
	{
		id: 'duckduckgo',
		parentId: 'search',
		referrer: 'DuckDuckGo',
		date: '2026-06-28',
		views: 39,
	},
	{
		id: 'yahoo',
		parentId: 'search',
		referrer: 'Yahoo',
		date: '2026-06-27',
		views: 14,
	},
	{ id: 'social', referrer: 'Social', medium: 'social', views: 345 },
	{
		id: 'facebook',
		parentId: 'social',
		referrer: 'Facebook',
		date: '2026-06-26',
		views: 210,
	},
	{
		id: 'x',
		parentId: 'social',
		referrer: 'X',
		date: '2026-06-25',
		views: 135,
	},
	{
		id: 'direct',
		referrer: 'Direct',
		medium: 'direct',
		views: 251,
	},
];

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
	return <>{ item.referrer }</>;
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

const meta: Meta< typeof DataViewsDrilldownTable< ReferrerRow > > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/DataViewsDrilldownTable',
	component: DataViewsDrilldownTable< ReferrerRow >,
	tags: [ 'autodocs' ],
};

export default meta;

type Story = StoryObj< typeof DataViewsDrilldownTable< ReferrerRow > >;

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
