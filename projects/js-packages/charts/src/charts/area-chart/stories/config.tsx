import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
} from '../../../stories/chart-decorator';
import { legendArgTypes } from '../../../stories/legend-config';
import { temperatureData as sampleData } from '../../../stories/sample-data';
import { sharedThemeArgs, themeArgTypes } from '../../../stories/theme-config';
import { lineChartTooltipArgTypes } from '../../../stories/tooltip-config';
import AreaChart from '../area-chart';
import type { LegendStoryControls } from '../../../stories/legend-config';
import type { TooltipStoryControls } from '../../../stories/tooltip-config';
import type { Meta } from '@storybook/react';

export type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof AreaChart > > &
	LegendStoryControls &
	TooltipStoryControls;

export const areaChartMetaArgs: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Area Chart',
	component: AreaChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...legendArgTypes,
		...themeArgTypes,
		...sharedChartArgTypes,
		...lineChartTooltipArgTypes,
		data: {
			control: { type: 'object' },
			description: 'Array of series data to display in the chart',
			table: { category: 'Data' },
		},
	},
};

export const areaChartStoryArgs = {
	...sharedThemeArgs,
	data: sampleData.slice( 0, 4 ),
	stacked: true,
	stackOffset: 'none' as const,
	smoothing: true,
	maxWidth: 1200,
	resizeDebounceTime: 300,
	options: {
		axis: {
			x: { orientation: 'bottom' as const },
			y: { orientation: 'left' as const },
		},
	},
	withTooltips: true,
};
