import { TreeRecordsTable } from '../tree-records-table';
import type { Meta, StoryObj } from '@storybook/react';
import type { DataViewRenderFieldProps, Field } from '@wordpress/dataviews';

type ReferrerRow = {
	id: string;
	parentId?: string;
	referrer: string;
	views: number;
};

const rows: ReferrerRow[] = [
	{ id: 'search', referrer: 'Search Engines', views: 625 },
	{ id: 'google', parentId: 'search', referrer: 'Google', views: 485 },
	{ id: 'bing', parentId: 'search', referrer: 'Bing', views: 86 },
	{ id: 'duckduckgo', parentId: 'search', referrer: 'DuckDuckGo', views: 39 },
	{ id: 'yahoo', parentId: 'search', referrer: 'Yahoo', views: 14 },
	{ id: 'social', referrer: 'Social', views: 345 },
	{ id: 'facebook', parentId: 'social', referrer: 'Facebook', views: 210 },
	{ id: 'linkedin', parentId: 'social', referrer: 'LinkedIn', views: 58 },
	{ id: 'direct', referrer: 'Direct', views: 251 },
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
 * Render the views field.
 *
 * @param props      - The DataViews render props.
 * @param props.item - The referrer row.
 * @return The rendered view count.
 */
function ViewsField( { item }: DataViewRenderFieldProps< ReferrerRow > ): JSX.Element {
	return <>{ item.views.toLocaleString() }</>;
}

const fields: Field< ReferrerRow >[] = [
	{
		id: 'referrer',
		label: 'Referrer',
		enableGlobalSearch: true,
		getValue: ( { item } ) => item.referrer,
		render: ReferrerField,
	},
	{
		id: 'views',
		label: 'Views',
		getValue: ( { item } ) => item.views,
		render: ViewsField,
	},
];

const initialView = {
	sort: { field: 'views', direction: 'desc' as const },
	fields: [ 'referrer', 'views' ],
	layout: {
		styles: {
			views: {
				align: 'end' as const,
			},
		},
	},
};

const meta: Meta< typeof TreeRecordsTable< ReferrerRow > > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/TreeRecordsTable',
	component: TreeRecordsTable< ReferrerRow >,
	tags: [ 'autodocs' ],
};

export default meta;

type Story = StoryObj< typeof TreeRecordsTable< ReferrerRow > >;

export const Default: Story = {
	args: {
		data: rows,
		fields,
		getItemId: item => item.id,
		getItemParentId: item => item.parentId,
		initialView,
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
