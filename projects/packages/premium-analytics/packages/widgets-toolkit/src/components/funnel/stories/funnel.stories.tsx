/**
 * External dependencies
 */
import { goal } from '@jetpack-premium-analytics/icons';
/**
 * Internal dependencies
 */
import { WidgetCard } from '../../../stories/widget-card';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { Funnel, type FunnelProps } from '../funnel';
import type { FunnelStepInput } from '../build-funnel-chart-data';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

const STEPS: FunnelStepInput[] = [
	{ id: 'sessions', label: 'Sessions', value: 1250, previousValue: 1100 },
	{ id: 'cart', label: 'Cart', value: 310, previousValue: 260 },
	{ id: 'checkout', label: 'Checkout', value: 140, previousValue: 120 },
	{ id: 'purchase', label: 'Purchase', value: 60, previousValue: 45 },
];

const READY = { isLoading: false, isError: false };

const withCard: Decorator = ( Story, { parameters } ) => (
	<WidgetCard height={ parameters.cardHeight ?? '360px' }>
		<Story />
	</WidgetCard>
);

const meta: Meta< typeof Funnel > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/Funnel',
	component: Funnel,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The funnel widget body: hand it the steps in order, as counts, and the request status, and it renders the rate of the whole with its delta, a bar per step with its share of the first step, the tooltip with the count, and the loading, error and empty states. Renders inside `WidgetRoot`.',
			},
		},
	},
	decorators: [ withCard, withWidgetRoot() ],
	args: {
		steps: STEPS,
		status: READY,
	},
};

export default meta;

type Story = StoryObj< FunnelProps >;

export const Default: Story = {};

export const WithComparison: Story = {
	args: { status: { ...READY, hasComparison: true } },
};

export const Loading: Story = {
	args: { status: { isLoading: true } },
};

export const Failed: Story = {
	args: { status: { isLoading: false, isError: true, refetch: () => undefined } },
};

export const Empty: Story = {
	args: {
		steps: [],
		empty: { icon: goal, description: 'No conversion data in this period.' },
	},
};

/**
 * A one-row dashboard tile: the funnel tightens its spacing so the bars keep their room.
 */
export const ShortTile: Story = {
	parameters: { cardHeight: '160px' },
};
