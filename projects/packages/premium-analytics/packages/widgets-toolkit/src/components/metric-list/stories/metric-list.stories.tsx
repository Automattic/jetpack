/**
 * Internal dependencies
 */
import { MetricList } from '../metric-list';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof MetricList > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/MetricList',
	component: MetricList,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'A label-and-value list that shows only complete rows within the available height.',
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof MetricList >;

const items = [
	{ id: 1, label: '4 Ways to Make Your Website Stand Out', value: '3.81%' },
	{ id: 2, label: 'Develop Locally on Linux with WordPress.com', value: '5.98%' },
	{ id: 3, label: '10 Brand-New WordPress.com Themes for 2026', value: '7.12%' },
	{ id: 4, label: 'WordPress.com Is Now Available in More Languages', value: '8.93%' },
	{ id: 5, label: 'WordCamp Europe 2026: What to Expect', value: '10.25%' },
	{ id: 6, label: 'Click, Comment, Done: A Better Way to Collaborate', value: '11.5%' },
];

/** Frame the story in a widget-sized card. */
const withCard =
	( height: string ): Decorator =>
	Story => (
		<div
			style={ {
				width: '420px',
				height,
				padding: '16px',
				border: '1px solid #e0e0e0',
				borderRadius: '8px',
				background: '#fff',
			} }
		>
			<Story />
		</div>
	);

export const Default: Story = {
	args: { items },
	decorators: [ withCard( 'auto' ) ],
};

/** Hide rows that do not fit. */
export const FittedToHeight: Story = {
	args: { items },
	decorators: [ withCard( '160px' ) ],
};

/** Render every row when fitting is disabled. */
export const AllRows: Story = {
	args: { items, fitRows: false },
	decorators: [ withCard( '160px' ) ],
};

/** Truncate long labels. */
export const LongLabels: Story = {
	args: {
		items: [
			{
				id: 1,
				label:
					'An exhaustively long, keyword-stuffed subject line that certainly needs truncating before it overflows the row',
				value: '4.1%',
			},
			{ id: 2, label: 'Your monthly digest: billing, features, and what is next', value: '6.7%' },
		],
	},
	decorators: [ withCard( 'auto' ) ],
};

/** Linked labels, the shape widgets pass in practice: they inherit the row's color and truncate the same way. */
export const LinkedLabels: Story = {
	args: {
		items: [
			{
				id: 1,
				label: (
					<a href="#linked-label-story">
						An exhaustively long, keyword-stuffed subject line that certainly needs truncating
						before it overflows the row
					</a>
				),
				value: '4.1%',
			},
			{
				id: 2,
				label: <a href="#linked-label-story">Your monthly digest: billing and features</a>,
				value: '6.7%',
			},
		],
	},
	decorators: [ withCard( 'auto' ) ],
};

export const Empty: Story = {
	args: { items: [], emptyStateText: 'No emails sent yet.' },
	decorators: [ withCard( '200px' ) ],
};
