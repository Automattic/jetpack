import { WidgetCard } from '../../../stories/widget-card';
import { GenericSkeleton } from '../generic-skeleton';
import { HeatmapSkeleton } from '../heatmap-skeleton';
import { MetricSparklineSkeleton } from '../metric-sparkline-skeleton';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta< typeof GenericSkeleton > = {
	title: 'Packages/Premium Analytics/Widgets Toolkit/Components/WidgetSkeleton',
	component: GenericSkeleton,
	tags: [ 'autodocs' ],
	parameters: {
		docs: {
			description: {
				component:
					"Fallback loading shape for widgets with no content-specific skeleton. Content-shaped skeletons pass their own shape through `WidgetState`'s `renderLoading`.",
			},
		},
	},
};

export default meta;

type Story = StoryObj< typeof GenericSkeleton >;

export const Default: Story = {
	render: () => (
		<WidgetCard height="320px">
			<GenericSkeleton />
		</WidgetCard>
	),
};

export const ShortTile: Story = {
	render: () => (
		<WidgetCard height="140px">
			<GenericSkeleton />
		</WidgetCard>
	),
};

type MetricSparklineStory = StoryObj< typeof MetricSparklineSkeleton >;

/**
 * The shape the headline-over-sparkline widgets (Total views, Total visitors,
 * Popular days) pass through `WidgetState`'s `renderLoading`: the metric value
 * and its label at the top, the sparkline band at the bottom of the body.
 */
export const MetricSparkline: MetricSparklineStory = {
	render: () => (
		<WidgetCard height="320px">
			<MetricSparklineSkeleton />
		</WidgetCard>
	),
};

/**
 * A height-1 dashboard tile. The band gives up its room down to 26px rather
 * than pushing the shape past the widget body.
 */
export const MetricSparklineShortTile: MetricSparklineStory = {
	render: () => (
		<WidgetCard height="140px">
			<MetricSparklineSkeleton />
		</WidgetCard>
	),
};

type HeatmapStory = StoryObj< typeof HeatmapSkeleton >;

/**
 * The shape the calendar-heatmap widgets (Traffic activity, Posting activity,
 * Post traffic activity) pass through `WidgetState`'s `renderLoading`: a fixed
 * 28-column, 3-row grid of square cells, centred in the body.
 */
export const Heatmap: HeatmapStory = {
	render: () => (
		<WidgetCard width="720px" height="320px">
			<HeatmapSkeleton />
		</WidgetCard>
	),
};

/**
 * A height-1 dashboard tile. The rows flatten to the room the body has rather
 * than pushing the grid past it into the widget footer.
 */
export const HeatmapShortTile: HeatmapStory = {
	render: () => (
		<WidgetCard width="720px" height="140px">
			<HeatmapSkeleton />
		</WidgetCard>
	),
};
