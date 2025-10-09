import { GlobalChartsProvider } from '../../../providers';
import { ChartStoryArgs, CHART_THEME_MAP, themeArgTypes } from '../../../stories';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs, glyphTheme, glyphRenderers } from './config';
import type { Meta, StoryFn, StoryObj, Decorator } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LineChart > >;

// Add the glyph theme to the theme map for glyph stories only
const GLYPH_THEME_MAP = {
	...CHART_THEME_MAP,
	glyph: glyphTheme,
};

// Custom decorator for glyph stories that includes the glyph theme
const glyphChartDecorator: Decorator = ( Story, { args } ) => {
	const themeName = ( args as unknown as StoryArgs ).themeName;
	const theme = GLYPH_THEME_MAP[ themeName || 'default' ];

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
};

const meta: Meta< StoryArgs > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts/Types/Line Chart/Glyphs',
	decorators: [ glyphChartDecorator ],
	argTypes: {
		...lineChartMetaArgs.argTypes,
		themeName: {
			...themeArgTypes.themeName,
			options: [ 'default', 'jetpack', 'woo', 'custom', 'glyph' ],
		},
		withStartGlyphs: {
			control: 'boolean',
			description: 'Show glyphs at line start',
			table: { category: 'Glyphs' },
		},
		withEndGlyphs: {
			control: 'boolean',
			description: 'Show glyphs at line end',
			table: { category: 'Glyphs' },
		},
		withLegendGlyph: {
			control: 'boolean',
			description: 'Show glyphs in legend',
			table: { category: 'Glyphs' },
		},
		glyphType: {
			control: 'radio',
			options: [ 'default', 'star', 'heart' ],
			description: 'Glyph shape',
			table: { category: 'Glyphs' },
		},
		glyphSize: {
			control: { type: 'range', min: 4, max: 16, step: 1 },
			description: 'Glyph size (radius)',
			table: { category: 'Glyphs' },
		},
	},
};

export default meta;

const Template: StoryFn< typeof LineChart > = args => <LineChart { ...args } />;

const glyphStoryArgs = {
	...lineChartStoryArgs,
	withStartGlyphs: true,
};

// Interactive story for exploring glyph options
export const GlyphConfiguration: StoryObj< StoryArgs > = {
	render: args => {
		const glyphType = args.glyphType || 'default';
		const glyphSize = args.glyphSize || 8;
		const glyphMap = {
			default: undefined,
			star: glyphRenderers.star,
			heart: glyphRenderers.heart,
		};

		return (
			<LineChart
				{ ...args }
				renderGlyph={ glyphMap[ glyphType ] }
				glyphStyle={ { radius: glyphSize } }
			/>
		);
	},
	args: {
		...glyphStoryArgs,
		glyphType: 'default',
		glyphSize: 8,
	},
};

// Example with theme-based glyphs per data point
export const ThemeGlyphs: StoryObj< StoryArgs > = Template.bind( {} );
ThemeGlyphs.args = {
	...glyphStoryArgs,
	showLegend: true,
	withLegendGlyph: true,
	themeName: 'glyph',
	glyphStyle: {
		radius: 8,
	},
};
