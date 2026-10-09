/**
 * External dependencies
 */
import { device } from '@jetpack-premium-analytics/icons';
/**
 * Internal dependencies
 */
import { WidgetCard } from '../../../stories/widget-card';
import { withWidgetRoot } from '../../../stories/with-widget-root';
import { SemiCircle, type SemiCircleProps, type SemiCircleSegmentInput } from '../semi-circle';
import type { Decorator, Meta, StoryObj } from '@storybook/react';

const SEGMENTS: SemiCircleSegmentInput[] = [
	{ label: 'Mobile', value: 3820, previousValue: 3000 },
	{ label: 'Desktop', value: 1210, previousValue: 1400 },
	{ label: 'Tablet', value: 310, previousValue: 420 },
];

const READY = { isLoading: false, isError: false };

const withCard: Decorator = Story => (
	<WidgetCard height="360px">
		<Story />
	</WidgetCard>
);

const meta: Meta< typeof SemiCircle > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/SemiCircle',
	component: SemiCircle,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					'The breakdown widget body drawn as a half ring: hand it segments and the request status, and it renders the chart with the total under the arc, the legend with a value and delta per segment, and the loading, error and empty states. Renders inside `WidgetRoot`.',
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

type Story = StoryObj< SemiCircleProps >;

export const Default: Story = {};

export const WithComparison: Story = {
	args: { status: { ...READY, hasComparison: true } },
};

// Shares of a whole: the total would always read 100%, so the arc carries no figure.
export const Shares: Story = {
	args: {
		segments: [
			{ label: 'Desktop', value: 0.62, previousValue: 0.58 },
			{ label: 'Mobile', value: 0.31, previousValue: 0.36 },
			{ label: 'Tablet', value: 0.07, previousValue: 0.06 },
		],
		status: { ...READY, hasComparison: true },
		format: { type: 'percentage', options: { decimals: 1, signDisplay: 'auto' } },
		withTotal: false,
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
		empty: { icon: device, description: 'No session data in this period.' },
	},
};
