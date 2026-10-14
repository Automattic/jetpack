import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
import { getComparisonLineWidth } from './private/comparison-line-paint';
import { ComparisonMarkerShape } from './private/comparison-marker';
import { COMPARISON_LINE_CASING } from './private/overlap-constants';
import type { LinePaint } from './private/comparison-line-paint';
import type { ComparisonMarker } from './types';
import type { LineStyles } from '@visx/xychart';
import type { FC } from 'react';

const SWATCH_WIDTH = 20;
const SWATCH_HEIGHT = 12;

export type ComparisonLineSwatchProps = {
	stroke: string;
	/** The comparison's `lineStyles`, so the swatch dashes and caps like the chart's line. */
	lineStyles?: LineStyles;
	marker: ComparisonMarker;
	width?: number;
	height?: number;
};

// An overlap comparison line and its marker, drawn into an existing SVG such as a legend glyph.
export const ComparisonLineGlyph: FC< ComparisonLineSwatchProps > = ( {
	stroke,
	lineStyles = {},
	marker,
	width = SWATCH_WIDTH,
	height = SWATCH_HEIGHT,
} ) => {
	const paint: LinePaint = lineStyles;
	const lineWidth = getComparisonLineWidth( paint );
	const y = height / 2;
	const geometry = { x1: 0, x2: width, y1: y, y2: y };

	return (
		<g data-testid="comparison-line-glyph">
			{ COMPARISON_LINE_CASING > 0 && (
				<line
					data-testid="comparison-line-glyph-casing"
					{ ...geometry }
					stroke={ CATALOG_POINTERS.background }
					strokeWidth={ lineWidth + COMPARISON_LINE_CASING * 2 }
				/>
			) }
			<line
				data-testid="comparison-line-glyph-line"
				{ ...paint }
				{ ...geometry }
				stroke={ stroke }
				strokeWidth={ lineWidth }
			/>
			<ComparisonMarkerShape
				data-testid="comparison-line-glyph-marker"
				marker={ marker }
				cx={ width / 2 }
				cy={ y }
				fill={ stroke }
			/>
		</g>
	);
};

// A standalone swatch of an overlap comparison line, for tooltips and custom legends.
export const ComparisonLineSwatch: FC< ComparisonLineSwatchProps > = ( {
	width = SWATCH_WIDTH,
	height = SWATCH_HEIGHT,
	...props
} ) => (
	<svg width={ width } height={ height } aria-hidden="true" data-testid="comparison-line-swatch">
		<ComparisonLineGlyph { ...props } width={ width } height={ height } />
	</svg>
);
