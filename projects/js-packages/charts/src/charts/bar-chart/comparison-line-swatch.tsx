import { CATALOG_POINTERS } from '../../providers/chart-context/private/catalog-pointers';
import { ComparisonMarkerShape } from './private/comparison-marker';
import { COMPARISON_LINE_CASING, COMPARISON_LINE_WIDTH } from './private/overlap-constants';
import type { ComparisonMarker } from './types';
import type { FC } from 'react';

export type ComparisonLineSwatchProps = {
	stroke: string;
	dash?: string | number;
	marker: ComparisonMarker;
	width?: number;
	height?: number;
};

// An overlap comparison line and its marker, drawn into an existing SVG such as a legend glyph.
export const ComparisonLineGlyph: FC< ComparisonLineSwatchProps > = ( {
	stroke,
	dash,
	marker,
	width = 20,
	height = 12,
} ) => {
	const y = height / 2;

	return (
		<g data-testid="comparison-line-glyph">
			{ COMPARISON_LINE_CASING > 0 && (
				<line
					data-testid="comparison-line-glyph-casing"
					x1={ 0 }
					x2={ width }
					y1={ y }
					y2={ y }
					stroke={ CATALOG_POINTERS.background }
					strokeWidth={ COMPARISON_LINE_WIDTH + COMPARISON_LINE_CASING * 2 }
				/>
			) }
			<line
				data-testid="comparison-line-glyph-line"
				x1={ 0 }
				x2={ width }
				y1={ y }
				y2={ y }
				stroke={ stroke }
				strokeWidth={ COMPARISON_LINE_WIDTH }
				strokeDasharray={ dash }
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
export const ComparisonLineSwatch: FC< ComparisonLineSwatchProps > = props => {
	const { width = 20, height = 12 } = props;

	return (
		<svg width={ width } height={ height } aria-hidden="true" data-testid="comparison-line-swatch">
			<ComparisonLineGlyph { ...props } width={ width } height={ height } />
		</svg>
	);
};
