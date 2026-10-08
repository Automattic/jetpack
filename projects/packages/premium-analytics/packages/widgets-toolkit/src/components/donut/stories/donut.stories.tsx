/**
 * External dependencies
 */
import { payment } from '@jetpack-premium-analytics/icons';
/**
 * Internal dependencies
 */
import { WidgetCard } from '../../../stories/widget-card';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { Donut, type DonutProps } from '../donut';
import type { DonutSegmentInput } from '../build-donut-chart-data';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

const SEGMENTS: DonutSegmentInput[] = [
	{ label: 'Returning', value: 3820, previousValue: 3000 },
	{ label: 'New', value: 1210, previousValue: 1400 },
];

const READY = { isLoading: false, isError: false };

const withCard: Decorator = Story => (
	<WidgetCard height="360px">
		<Story />
	</WidgetCard>
);

const meta: Meta< typeof Donut > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/Donut',
	component: Donut,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The breakdown widget body: hand it segments and the request status, and it renders the donut chart with the total in the center, the legend with a value and delta per segment, and the loading, error and empty states. Renders inside `WidgetRoot`.',
			},
		},
	},
	decorators: [ withCard, withWidgetRoot() ],
	args: {
		segments: SEGMENTS,
		status: READY,
	},
};

export default meta;

type Story = StoryObj< DonutProps >;

export const Default: Story = {};

export const WithComparison: Story = {
	args: { status: { ...READY, hasComparison: true } },
};

export const Currency: Story = {
	args: {
		segments: [
			{ label: 'Paid', value: 182_400, previousValue: 170_900 },
			{ label: 'Unpaid', value: 9_650, previousValue: 12_300 },
		],
		status: { ...READY, hasComparison: true },
		format: { type: 'currency', options: { useMultipliers: true } },
	},
};

export const WithMutedSegment: Story = {
	args: {
		segments: [
			{ label: 'Booked', value: 48 },
			{ label: 'Checked In', value: 31 },
			{ label: 'No Show', value: 6 },
			{ label: 'Cancelled', value: 9, muted: true },
		],
		format: { type: 'number', options: { useMultipliers: false, decimals: 0 } },
	},
};

// Booked 5 and Cancelled 5 before, Booked 10 now: the total holds at 10, so the center reads 0%
// and the empty status keeps its row with its own −100%.
export const WithAnEmptySegment: Story = {
	args: {
		segments: [
			{ label: 'Booked', value: 10, previousValue: 5 },
			{ label: 'Cancelled', value: 0, previousValue: 5, muted: true },
		],
		status: { ...READY, hasComparison: true },
		format: { type: 'number', options: { useMultipliers: false, decimals: 0 } },
	},
};

export const Loading: Story = {
	args: { status: { isLoading: true } },
};

export const Failed: Story = {
	args: { status: { isLoading: false, isError: true, refetch: () => undefined } },
};

export const Empty: Story = {
	args: {
		segments: [],
		empty: { icon: payment, description: 'No order revenue in this period.' },
	},
};
