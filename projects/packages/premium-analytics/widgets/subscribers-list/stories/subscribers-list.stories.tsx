/**
 * Internal dependencies
 */
import { withChartTheme } from '../../../packages/widgets-toolkit/src/stories/with-chart-theme';
import { SubscribersRoster } from '../render';
import type { SubscriberListItem } from '@jetpack-premium-analytics/widgets-toolkit';
import type { Meta, StoryObj, Decorator } from '@storybook/react';

const meta: Meta< typeof SubscribersRoster > = {
	title: 'Packages/Premium Analytics/Widgets/SubscribersList',
	component: SubscribersRoster,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The "Latest Subscribers" widget. Renders the most recent subscribers as a roster — avatar, name, and the relative time since they subscribed — with an "N more" footer for the remainder. This is the presentational layer: it takes already-fetched rows via props and handles the loading, error, empty, and populated states. The data-connected widget (render.tsx default export) wraps this in WidgetRoot and feeds it the designated useStatsFollowers hook.',
			},
		},
	},
	decorators: [ withChartTheme ],
};

export default meta;

type Story = StoryObj< typeof SubscribersRoster >;

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
	{
		id: 4,
		name: 'Emma Rossi',
		avatarUrl: 'https://i.pravatar.cc/64?img=20',
		href: '#',
		secondaryText: '3h ago',
	},
	{
		id: 5,
		name: 'Aarav Patel',
		avatarUrl: 'https://i.pravatar.cc/64?img=15',
		href: '#',
		secondaryText: '5h ago',
	},
	{
		id: 6,
		name: 'Sofia Nguyen',
		avatarUrl: 'https://i.pravatar.cc/64?img=47',
		href: '#',
		secondaryText: 'Yesterday',
	},
];

/**
 * Default populated state — the six most recent subscribers, with 24 more
 * beyond the list.
 */
export const Default: Story = {
	args: {
		items: mockItems,
		moreCount: 24,
	},
};

/**
 * Loading state — the roster renders its loading overlay while data is fetched.
 */
export const Loading: Story = {
	args: {
		items: [],
		isLoading: true,
	},
};

/**
 * Empty state — the site has no subscribers yet.
 */
export const Empty: Story = {
	args: {
		items: [],
	},
};

/**
 * Error state — the report could not be loaded.
 */
export const ErrorState: Story = {
	args: {
		isError: true,
	},
};

const mockLongNameItems: SubscriberListItem[] = [
	{
		id: 1,
		name: 'Maximilian Alexander Featherstonehaugh-Worthington III',
		avatarUrl: 'https://i.pravatar.cc/64?img=8',
		href: '#',
		secondaryText: '2h ago',
	},
	{
		id: 2,
		name: 'subscriber-with-a-very-long-email-address@averylongdomainname.example.com',
		secondaryText: '4h ago',
	},
];

/**
 * Long names truncate with an ellipsis so rows stay single-line and the
 * "since" time stays visible.
 */
export const LongNames: Story = {
	args: {
		items: mockLongNameItems,
	},
};

/**
 * Creates a decorator that constrains the story to a fixed width so the
 * roster's responsiveness can be inspected.
 *
 * @param width - The container width (any CSS length).
 * @return A Storybook decorator.
 */
const createSizeDecorator = ( width: string ): Decorator => {
	return Story => (
		<div
			style={ {
				width,
				border: '1px dashed #ccc',
				borderRadius: '8px',
				padding: '16px',
				containerType: 'inline-size',
				containerName: 'widget',
			} }
		>
			<Story />
		</div>
	);
};

/**
 * Medium container (448px / md breakpoint).
 */
export const SizeMedium: Story = {
	args: {
		items: mockItems,
		moreCount: 24,
	},
	decorators: [ createSizeDecorator( '448px' ) ],
};
