import { GlyphStar } from '@visx/glyph';
import React from 'react';
import LineChart from '../line-chart';
import { lineChartMetaArgs, lineChartStoryArgs } from './config';
import type { Meta, StoryFn, StoryObj } from '@storybook/react';

const meta: Meta< typeof LineChart > = {
	...lineChartMetaArgs,
	title: 'JS Packages/Charts/Types/Line Chart/Glyphs',
} satisfies Meta< typeof LineChart >;

export default meta;

const Template: StoryFn< typeof LineChart > = args => <LineChart { ...args } />;

const glyphStoryArgs = {
	...lineChartStoryArgs,
	withStartGlyphs: true,
};

export const Start: StoryObj< typeof LineChart > = Template.bind( {} );
Start.args = {
	...glyphStoryArgs,
};

export const Custom: StoryObj< typeof LineChart > = Template.bind( {} );
Custom.args = {
	...glyphStoryArgs,
	showLegend: true,
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

export const CustomSvg: StoryObj< typeof LineChart > = Template.bind( {} );
CustomSvg.args = {
	...glyphStoryArgs,
	showLegend: true,
	withLegendGlyph: true,
	renderGlyph: ( { color, size, x, y } ) => (
		<CustomStarGlyph color={ color } size={ size } x={ x } y={ y } />
	),
	glyphStyle: {
		radius: 8,
	},
};
