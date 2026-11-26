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
	likes: number;
	comments: number;
};

const POSTS: PostRow[] = [
	{ id: '1', title: 'Getting Started with WordPress', views: 3820, likes: 96, comments: 14 },
	{ id: '2', title: 'Product Launch Highlights', views: 2640, likes: 187, comments: 42 },
	{ id: '3', title: 'Customer Story: Acme', views: 1210, likes: 64, comments: 3 },
	{ id: '4', title: 'Behind the Scenes', views: 940, likes: 133, comments: 27 },
	{ id: '5', title: 'A Guide to Better Images', views: 735, likes: 48, comments: 9 },
	{ id: '6', title: 'Meet the Team', views: 620, likes: 152, comments: 31 },
	{ id: '7', title: 'Our Favorite Development Tools', views: 510, likes: 41, comments: 18 },
	{ id: '8', title: 'Understanding Web Performance', views: 405, likes: 77, comments: 6 },
	{ id: '9', title: 'A Year in Review', views: 320, likes: 110, comments: 22 },
	{ id: '10', title: 'Design Trends for Publishers', views: 245, likes: 12, comments: 1 },
	{ id: '11', title: 'How We Grew Our Newsletter', views: 180, likes: 59, comments: 11 },
	{ id: '12', title: 'The Complete SEO Checklist', views: 95, likes: 23, comments: 0 },
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
	{
		id: 'likes',
		label: 'Likes',
		getValue: ( { item } ) => item.likes,
	},
	{
		id: 'comments',
		label: 'Comments',
		getValue: ( { item } ) => item.comments,
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
				component:
					'A searchable, sortable and paginated records table for dashboard widgets. A sortable column sorts from its header: one click sorts by it, the next one flips the direction.',
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
			fields: [ 'views', 'likes', 'comments' ],
			sort: { field: 'views', direction: 'desc' },
			layout: {
				styles: {
					views: { align: 'end' },
					likes: { align: 'end' },
					comments: { align: 'end' },
				},
			},
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
