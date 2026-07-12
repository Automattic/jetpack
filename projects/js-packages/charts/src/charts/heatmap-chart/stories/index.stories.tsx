import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
} from '../../../stories/chart-decorator';
import {
	heatmapActivityMatrix,
	heatmapCalendarSeries,
	heatmapLargeValueMatrix,
	heatmapPartialMonthCalendarSeries,
} from '../../../stories/sample-data';
import { sharedThemeArgs, themeArgTypes } from '../../../stories/theme-config';
import { HeatmapChart } from '../index';
import { buildCalendarHeatmapData } from '../private';
import type { Meta, StoryObj } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof HeatmapChart > >;

const meta: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Heatmap Chart',
	component: HeatmapChart,
	parameters: { layout: 'centered' },
	decorators: [ chartDecorator ],
	argTypes: {
		...sharedChartArgTypes,
		...themeArgTypes,
		compact: { control: 'boolean', table: { category: 'Visual Style' } },
		showValues: { control: 'boolean', table: { category: 'Visual Style' } },
	},
} satisfies Meta< StoryArgs >;

export default meta;
type Story = StoryObj< StoryArgs >;

export const Default: Story = {
	args: {
		...sharedThemeArgs,
		data: heatmapActivityMatrix,
		rowLabels: [ 'Mon', '', 'Wed', '', 'Fri', '', '' ],
		withTooltips: true,
	},
};

export const Compact: Story = {
	args: { ...Default.args, compact: true, containerHeight: '160px' },
};

export const LargeValues: Story = {
	args: {
		...Default.args,
		data: heatmapLargeValueMatrix,
	},
};

export const Calendar: StoryObj< StoryArgs & { weekStartsOn: 0 | 1 } > = {
	render: ( { weekStartsOn, ...args } ) => {
		const { data, rowLabels } = buildCalendarHeatmapData( heatmapCalendarSeries, {
			weekStartsOn,
		} );
		return <HeatmapChart { ...args } data={ data } rowLabels={ rowLabels } />;
	},
	args: { ...sharedThemeArgs, withTooltips: true, weekStartsOn: 1 },
	argTypes: {
		weekStartsOn: {
			control: { type: 'inline-radio', labels: { 0: 'Sunday', 1: 'Monday' } },
			options: [ 1, 0 ],
			table: { category: 'Calendar' },
		},
	},
};

// Regression story for a one-column first month label in compact mode.
export const CompactCalendarPartialMonth: StoryObj< StoryArgs & { weekStartsOn: 0 | 1 } > = {
	render: ( { weekStartsOn, ...args } ) => {
		const { data, rowLabels } = buildCalendarHeatmapData( heatmapPartialMonthCalendarSeries, {
			weekStartsOn,
		} );
		return <HeatmapChart { ...args } data={ data } rowLabels={ rowLabels } />;
	},
	args: { ...sharedThemeArgs, compact: true, withTooltips: true, weekStartsOn: 1 },
	argTypes: {
		weekStartsOn: {
			control: { type: 'inline-radio', labels: { 0: 'Sunday', 1: 'Monday' } },
			options: [ 1, 0 ],
			table: { category: 'Calendar' },
		},
	},
};

export const WithCompositionLegend: Story = {
	render: args => (
		<HeatmapChart { ...args } chartId="composition-heatmap">
			<HeatmapChart.Legend />
		</HeatmapChart>
	),
	args: { ...Default.args },
};

export const FixedDimensions: Story = {
	args: {
		...Default.args,
		width: 720,
		height: 220,
	},
};

export const AspectRatio: Story = {
	args: {
		...Default.args,
		aspectRatio: 0.4,
	},
};

export const ErrorStates: Story = {
	args: {
		...Default.args,
		data: [],
	},
};
