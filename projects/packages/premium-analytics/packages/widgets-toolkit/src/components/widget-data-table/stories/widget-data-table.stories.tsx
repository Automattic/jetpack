/**
 * Internal dependencies
 */
import { WidgetCard } from '../../../stories/widget-card';
import { WidgetDataTable } from '../widget-data-table';
import type { Field } from '@jetpack-premium-analytics/externals';
import type { Meta, StoryObj } from '@storybook/react';

type PostRow = {
	id: string;
	title: string;
	views: number;
};

const POSTS: PostRow[] = [
	{ id: '1', title: 'Getting Started with WordPress', views: 3820 },
	{ id: '2', title: 'Product Launch Highlights', views: 2640 },
	{ id: '3', title: 'Customer Story: Acme', views: 1210 },
	{ id: '4', title: 'Behind the Scenes', views: 940 },
	{ id: '5', title: 'A Guide to Better Images', views: 735 },
	{ id: '6', title: 'Meet the Team', views: 620 },
	{ id: '7', title: 'Our Favorite Development Tools', views: 510 },
	{ id: '8', title: 'Understanding Web Performance', views: 405 },
	{ id: '9', title: 'A Year in Review', views: 320 },
	{ id: '10', title: 'Design Trends for Publishers', views: 245 },
	{ id: '11', title: 'How We Grew Our Newsletter', views: 180 },
	{ id: '12', title: 'The Complete SEO Checklist', views: 95 },
];

const FIELDS: Field< PostRow >[] = [
	{
		id: 'title',
		label: 'Post title',
		enableGlobalSearch: true,
		enableHiding: false,
		getValue: ( { item } ) => item.title,
	},
	{
		id: 'views',
		label: 'Views',
		getValue: ( { item } ) => item.views,
	},
];

const meta = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/WidgetDataTable',
	component: WidgetDataTable< PostRow >,
	tags: [ 'autodocs' ],
	parameters: {
		layout: 'centered',
		docs: {
			description: {
				component: 'A searchable, sortable and paginated records table for dashboard widgets.',
			},
		},
	},
	decorators: [
		Story => (
			<WidgetCard width="800px" height="520px">
				<Story />
			</WidgetCard>
		),
	],
} satisfies Meta< typeof WidgetDataTable< PostRow > >;

export default meta;

type Story = StoryObj< typeof meta >;

export const Default: Story = {
	args: {
		data: POSTS,
		fields: FIELDS,
		getItemId: item => item.id,
		status: { isLoading: false },
		initialView: {
			titleField: 'title',
			fields: [ 'views' ],
			sort: { field: 'views', direction: 'desc' },
		},
		searchLabel: 'Search posts',
	},
};

export const Loading: Story = {
	args: { ...Default.args, status: { isLoading: true } },
};

export const Failed: Story = {
	args: {
		...Default.args,
		data: [],
		status: { isLoading: false, isError: true, refetch: () => undefined },
	},
};

export const Empty: Story = {
	args: { ...Default.args, data: [] },
};
