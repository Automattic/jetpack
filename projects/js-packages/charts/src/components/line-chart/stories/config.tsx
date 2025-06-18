import { GlyphDiamond, GlyphStar } from '@visx/glyph';
import React from 'react';
import { jetpackTheme, wooTheme, ThemeProvider } from '../../../providers/theme';
import { DefaultGlyph } from '../../shared/default-glyph';
import LineChart from '../line-chart';
import sampleData from './sample-data';
import type { Meta } from '@storybook/react';

const customStorybookTheme = {
	...jetpackTheme,
	glyphs: [
		props => React.createElement( DefaultGlyph, { ...props, key: props.key } ),
		props =>
			React.createElement( GlyphStar, {
				key: props.key,
				top: props.y,
				left: props.x,
				size: props.size * props.size,
				fill: props.color,
			} ),
		props =>
			React.createElement( GlyphDiamond, {
				key: props.key,
				top: props.y,
				left: props.x,
				size: props.size * props.size,
				fill: props.color,
			} ),
	],
};

const THEME_MAP = {
	default: undefined,
	jetpack: jetpackTheme,
	woo: wooTheme,
	customStorybook: customStorybookTheme,
};

export const lineChartMetaArgs = {
	title: 'JS Packages/Charts/Types/Line Chart',
	component: LineChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [
		( Story, { args } ) => {
			const theme = THEME_MAP[ args.themeName ];

			return (
				<ThemeProvider theme={ theme }>
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
				</ThemeProvider>
			);
		},
	],
	argTypes: {
		themeName: {
			control: 'select',
			options: [ 'default', 'jetpack', 'woo', 'customStorybook' ],
			defaultValue: 'default',
		},
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
} satisfies Meta< typeof LineChart >;

export const lineChartStoryArgs = {
	data: sampleData,
	showLegend: false,
	legendOrientation: 'horizontal',
	withGradientFill: false,
	smoothing: true,
	maxWidth: 1200,
	aspectRatio: 0.5,
	resizeDebounceTime: 300,
	options: {
		axis: {
			x: {
				orientation: 'bottom',
			},
			y: {
				orientation: 'left',
			},
		},
	},
	withTooltips: true,
};
