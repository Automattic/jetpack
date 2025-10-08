import { GlyphDiamond, GlyphStar } from '@visx/glyph';
import merge from 'deepmerge';
import { createElement } from 'react';
import { jetpackTheme } from '../../../providers';
import {
	chartDecorator,
	sharedChartArgTypes,
	ChartStoryArgs,
} from '../../../stories/chart-decorator';
import { legendArgTypes } from '../../../stories/legend-config';
import { temperatureData as sampleData } from '../../../stories/sample-data';
import { themeArgTypes } from '../../../stories/theme-config';
import { DefaultGlyph } from '../../private/default-glyph';
import LineChart from '../line-chart';
import type { Meta } from '@storybook/react';

type StoryArgs = ChartStoryArgs< React.ComponentProps< typeof LineChart > >;

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
				size: props.size,
				fill: props.color,
			} ),
		props =>
			createElement( GlyphDiamond, {
				key: props.key,
				top: props.y,
				left: props.x,
				size: props.size,
				fill: props.color,
			} ),
	],
	annotationStyles: {
		label: {
			maxWidth: 250,
		},
	},
} );

/**
 * Shared glyph renderers for stories
 */
export const glyphRenderers = {
	star: ( { color, size, x, y } ) => (
		<GlyphStar top={ y } left={ x } size={ size } fill={ color } />
	),
	starOutline: ( { color, size, x, y } ) => (
		<GlyphStar top={ y } left={ x } size={ size } fill="#fff" stroke={ color } />
	),
	heart: ( { color, size, x, y } ) => {
		const hasXY = typeof x === 'number' && typeof y === 'number';
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
	},
};

export const lineChartMetaArgs: Meta< StoryArgs > = {
	title: 'JS Packages/Charts/Types/Line Chart',
	component: LineChart,
	parameters: {
		layout: 'centered',
	},
	decorators: [ chartDecorator ],
	argTypes: {
		...legendArgTypes,
		...themeArgTypes,
		...sharedChartArgTypes,
	},
};

export const lineChartStoryArgs = {
	data: sampleData.slice( 0, 4 ),
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
