import { GlyphStar } from '@visx/glyph';
import { useGlobalChartsTheme, GlobalChartsProvider } from '../../../providers';
import { ChartStoryArgs, CHART_THEME_MAP, themeArgTypes } from '../../../stories';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs, glyphTheme } from './config';
import type { DataPointDate } from '../../../types';
import type { Meta, StoryFn, StoryObj, Decorator } from '@storybook/react';
import type { RenderTooltipParams } from '@visx/xychart/lib/components/Tooltip';

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
	},
};

export default meta;

const Template: StoryFn< typeof LineChart > = args => <LineChart { ...args } />;

const glyphStoryArgs = {
	...lineChartStoryArgs,
	withStartGlyphs: true,
};

export const Start: StoryObj< StoryArgs > = Template.bind( {} );
Start.args = {
	...glyphStoryArgs,
};

export const Custom: StoryObj< StoryArgs > = Template.bind( {} );
Custom.args = {
	...glyphStoryArgs,
	withLegendGlyph: true,
	renderGlyph: ( { color, size, x, y } ) => {
		return <GlyphStar top={ y } left={ x } size={ size * size } fill={ color } />;
	},
	glyphStyle: {
		radius: 10,
	},
};

const CustomStarGlyph = ( { color, size, x, y } ) => {
	const hasXY = typeof x === 'number' && typeof y === 'number' && ( x !== 0 || y !== 0 );
	const groupProps = hasXY ? { transform: `translate(${ x }, ${ y })` } : {};
	return (
		<g { ...groupProps }>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width={ size * 2 }
				height={ size * 2 }
				viewBox="0 0 24 24"
				style={ { overflow: 'visible', pointerEvents: 'none' } }
			>
				<path
					d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
					fill={ color }
					stroke={ color }
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
					transform="translate(-12, -12)"
				/>
			</svg>
		</g>
	);
};

export const CustomSvg: StoryObj< StoryArgs > = Template.bind( {} );
CustomSvg.args = {
	...glyphStoryArgs,
	withLegendGlyph: true,
	renderGlyph: ( { color, size, x, y } ) => (
		<CustomStarGlyph color={ color } size={ size } x={ x } y={ y } />
	),
	glyphStyle: {
		radius: 8,
	},
};

const ToolTipWithGlyph = ( { tooltipData }: RenderTooltipParams< DataPointDate > ) => {
	const providerTheme = useGlobalChartsTheme();

	return (
		<div>
			<div style={ { marginBottom: '0.5rem' } }>
				{ tooltipData?.nearestDatum?.datum?.date?.toLocaleDateString() }
			</div>
			<div>
				{ Object.entries( tooltipData?.datumByKey || {} ).map( ( [ key, value ], index ) => {
					const { datum } = value as { datum: { value: number } };
					return (
						<div key={ key }>
							<div
								style={ {
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									marginBottom: '0.2rem',
								} }
							>
								<svg width={ 20 } height={ 20 }>
									<GlyphStar
										size={ 10 * 10 }
										top={ 10 }
										left={ 10 }
										fill={ '#fff' }
										stroke={ providerTheme.colors[ index % providerTheme.colors.length ] }
									/>
								</svg>
								{ key }: { datum.value }
							</div>
						</div>
					);
				} ) }
			</div>
		</div>
	);
};

export const InTooltip: StoryObj< StoryArgs > = Template.bind( {} );
InTooltip.args = {
	...glyphStoryArgs,
	renderGlyph: ( { color, size, x, y } ) => {
		return <GlyphStar top={ y } left={ x } size={ size * size } fill={ '#fff' } stroke={ color } />;
	},
	glyphStyle: {
		radius: 10,
	},
	renderTooltip: ToolTipWithGlyph,
};

export const CustomPerDataPoint: StoryObj< StoryArgs > = Template.bind( {} );
CustomPerDataPoint.args = {
	...glyphStoryArgs,
	showLegend: true,
	withStartGlyphs: true,
	withLegendGlyph: true,
	themeName: 'glyph', // Mock prop used to switch the rendered theme in the storybook.
	glyphStyle: {
		radius: 8,
	},
};
