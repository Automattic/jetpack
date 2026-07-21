import { GlyphDiamond, GlyphStar } from '@visx/glyph';
import merge from 'deepmerge';
import { createElement } from 'react';
import { defaultTheme } from '../../../providers';
import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
} from '../../../stories/chart-decorator';
import { legendArgTypes } from '../../../stories/legend-config';
import { temperatureData as sampleData } from '../../../stories/sample-data';
import { sharedThemeArgs, themeArgTypes } from '../../../stories/theme-config';
import { lineChartTooltipArgTypes } from '../../../stories/tooltip-config';
import { DefaultGlyph } from '../../private/default-glyph';
import LineChart from '../line-chart';
import type { LegendStoryControls } from '../../../stories/legend-config';
import type { TooltipStoryControls } from '../../../stories/tooltip-config';
import type { Meta } from '@storybook/react';

export type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LineChart > > &
	LegendStoryControls &
	TooltipStoryControls;

/**
 * Custom storybook theme with glyphs
 */
export const glyphTheme = merge( defaultTheme, {
	glyphs: [
		props => createElement( DefaultGlyph, { ...props, key: props.key } ),
		props =>
			createElement( GlyphStar, {
				key: props.key,
				top: props.y,
				left: props.x,
				size: props.size * props.size,
				fill: props.color,
			} ),
		props =>
			createElement( GlyphDiamond, {
				key: props.key,
				top: props.y,
				left: props.x,
				size: props.size * props.size,
				fill: props.color,
			} ),
	],
	annotationStyles: {
		label: {
			maxWidth: 250,
		},
	},
} );

export const lineChartMetaArgs: Meta< StoryArgs > = {
	title: 'JS Packages/Charts Library/Charts/Line Chart',
	component: LineChart,
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

export const lineChartStoryArgs = {
	...sharedThemeArgs,
	data: sampleData.slice( 0, 4 ),
	withGradientFill: false,
	withLegendGlyph: false,
	smoothing: true,
	maxWidth: 1200,
	resizeDebounceTime: 300,
	options: {
		axis: {
			x: {
				orientation: 'bottom' as const,
			},
			y: {
				orientation: 'left' as const,
			},
		},
	},
	withTooltips: true,
};
