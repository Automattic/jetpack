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
					'A label-and-value list for widgets whose rows are ordered by recency rather than ranked by a metric, where a bar leaderboard would read as a ranking the order does not express. Rows share the 36px rhythm of a compact leaderboard row. With `fitRows` on (the default) the list shows only the rows that fit its height, so the last row is never clipped part-way.',
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

/**
 * Frames the list in a widget-sized box so the row rhythm reads as it does in
 * a dashboard tile.
 */
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

/**
 * A tile too short for every row: the list drops the rows that would be
 * clipped instead of showing a half-row at the bottom.
 */
export const FittedToHeight: Story = {
	args: { items },
	decorators: [ withCard( '160px' ) ],
};

/**
 * Fitting off — every row renders and the list overflows its box.
 */
export const AllRows: Story = {
	args: { items, fitRows: false },
	decorators: [ withCard( '160px' ) ],
};

/**
 * Long labels truncate with an ellipsis so rows stay single-line and the value
 * column keeps its place.
 */
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

export const Empty: Story = {
	args: { items: [], emptyStateText: 'No emails sent yet.' },
	decorators: [ withCard( '200px' ) ],
};
