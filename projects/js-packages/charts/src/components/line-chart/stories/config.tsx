import { GlyphDiamond, GlyphStar } from '@visx/glyph';
import merge from 'deepmerge';
import { createElement } from 'react';
import { GlobalChartsProvider } from '../../../providers/chart-context/global-charts-provider';
import { jetpackTheme } from '../../../providers/theme/themes';
import { legendArgTypes } from '../../../stories/legend-config';
import { temperatureData as sampleData } from '../../../stories/sample-data';
import { CHART_THEME_MAP, themeArgTypes } from '../../../stories/theme-config';
import { DefaultGlyph } from '../../default-glyph';
import LineChart from '../line-chart';
import type { Meta } from '@storybook/react';

type StoryArgs = React.ComponentProps< typeof LineChart > & {
	themeName?: string;
};

/**
 * Custom storybook theme with glyphs
 */
export const glyphTheme = merge( jetpackTheme, {
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
	title: 'JS Packages/Charts/Types/Line Chart',
	component: LineChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		( Story, { args }: { args: StoryArgs } ) => {
			const theme = CHART_THEME_MAP[ args.themeName || 'default' ];

			return (
				<GlobalChartsProvider theme={ theme }>
					<div
						style={ {
							resize: 'both',
							overflow: 'auto',
							padding: '2rem',
							width: '800px',
							maxWidth: '1200px',
							border: '1px dashed #ccc',
							display: 'inline-block',
						} }
					>
						<Story />
					</div>
				</GlobalChartsProvider>
			);
		},
	],
	argTypes: {
		...legendArgTypes,
		...themeArgTypes,
		maxWidth: {
			control: {
				type: 'number',
				min: 100,
				max: 1200,
			},
		},
		aspectRatio: {
			control: {
				type: 'number',
				min: 0,
				max: 1,
			},
		},
		resizeDebounceTime: {
			control: {
				type: 'number',
				min: 0,
				max: 10000,
			},
		},
	},
};

export const lineChartStoryArgs = {
	data: sampleData,
	withGradientFill: false,
	withLegendGlyph: false,
	smoothing: true,
	maxWidth: 1200,
	aspectRatio: 0.5,
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
