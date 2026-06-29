/**
 * Internal dependencies
 */
import { withChartTheme } from '../../../stories/with-chart-theme';
import { SubscriberList } from '../subscriber-list';
import type { SubscriberListItem } from '../subscriber-list';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof SubscriberList > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/SubscriberList',
	component: SubscriberList,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'Generic roster component — avatar, name, and an optional relative-time secondary line per row, with an optional "N more" footer. For list-style stats (e.g. Subscribers, comment followers) where rows are ordered by recency rather than ranked by a metric.',
			},
		},
	},
	decorators: [ withChartTheme ],
};

export default meta;

type Story = StoryObj< typeof SubscriberList >;

const mockItems: SubscriberListItem[] = [
	{
		id: 1,
		name: 'Diego Morales',
		avatarUrl: 'https://i.pravatar.cc/64?img=12',
		href: '#',
		secondaryText: 'Just now',
	},
	{
		id: 2,
		name: 'Olivia Park',
		avatarUrl: 'https://i.pravatar.cc/64?img=5',
		href: '#',
		secondaryText: '12m ago',
	},
	{
		id: 3,
		name: 'Hiroshi Tanaka',
		avatarUrl: 'https://i.pravatar.cc/64?img=33',
		href: '#',
		secondaryText: '1h ago',
	},
];

/**
 * Populated roster with an "N more" footer.
 */
export const Default: Story = {
	args: {
		items: mockItems,
		moreCount: 24,
	},
};

/**
 * Loading state.
 */
export const Loading: Story = {
	args: {
		items: [],
		loading: true,
	},
};

/**
 * Empty state.
 */
export const Empty: Story = {
	args: {
		items: [],
		emptyStateText: 'No subscribers yet.',
	},
};
