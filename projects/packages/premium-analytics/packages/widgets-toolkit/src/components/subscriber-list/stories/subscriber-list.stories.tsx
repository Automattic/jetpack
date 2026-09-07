import { WidgetCard } from '../../../stories/widget-card';
import { SubscriberList } from '../subscriber-list';
import { SubscriberListSkeleton } from '../subscriber-list-skeleton';
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
					'A roster of people — avatar, name, and an optional relative-time secondary line per row. Used by list-style Stats widgets (latest subscribers, post likes, post comments) where rows are ordered by recency rather than ranked by a metric.',
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof SubscriberList >;

const mockItems: SubscriberListItem[] = [
	{ id: 1, name: 'Amelia Hart', href: 'https://example.com/amelia', secondaryText: '2 hours ago' },
	{ id: 2, name: 'Benedict Okonkwo', secondaryText: '5 hours ago' },
	{ id: 3, name: 'Chiara Rossi', href: 'https://example.com/chiara', secondaryText: 'Yesterday' },
	{ id: 4, name: 'Daniel Nguyen', secondaryText: '3 days ago' },
	{ id: 5, name: 'Eve', href: 'https://example.com/eve', secondaryText: 'Last week' },
	{ id: 6, name: 'Farrah Al-Amin', secondaryText: '2 weeks ago' },
];

export const Default: Story = {
	args: { items: mockItems, moreCount: 128 },
};

type SkeletonStory = StoryObj< typeof SubscriberListSkeleton >;

/**
 * The loading shape the roster widgets pass through `WidgetState`'s
 * `renderLoading`: an avatar, a name line, and the trailing "since" line per
 * row, centred in the body.
 */
export const Skeleton: SkeletonStory = {
	render: args => (
		<WidgetCard height="320px">
			<SubscriberListSkeleton { ...args } />
		</WidgetCard>
	),
	args: { rows: 6 },
};

/**
 * A height-1 dashboard tile. Too short to centre ten rows, so they pack from the
 * top and the tail is clipped rather than pushed past the widget body.
 */
export const SkeletonShortTile: SkeletonStory = {
	render: args => (
		<WidgetCard height="140px">
			<SubscriberListSkeleton { ...args } />
		</WidgetCard>
	),
	args: { rows: 10 },
};
