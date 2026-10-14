import { CATALOG_POINTERS } from '../../../providers/chart-context/private/catalog-pointers';
import { COMPARISON_MARKER_HALO, COMPARISON_MARKER_SIZE } from './overlap-constants';
import type { ComparisonMarker } from '../types';
import type { FC } from 'react';

type Props = {
	marker: ComparisonMarker;
	cx: number;
	cy: number;
	fill: string;
	'data-testid'?: string;
};

// One reading's marker, shared by the chart's comparison lines and their legend glyph.
export const ComparisonMarkerShape: FC< Props > = ( {
	marker,
	cx,
	cy,
	fill,
	'data-testid': testId,
} ) => {
	const paint = {
		fill,
		stroke: CATALOG_POINTERS.background,
		strokeWidth: COMPARISON_MARKER_HALO * 2,
		// Stroke first, so the fill covers the halo's inner half.
		paintOrder: 'stroke',
		'data-testid': testId,
	};

	return marker === 'square' ? (
		<rect
			x={ cx - COMPARISON_MARKER_SIZE }
			y={ cy - COMPARISON_MARKER_SIZE }
			width={ COMPARISON_MARKER_SIZE * 2 }
			height={ COMPARISON_MARKER_SIZE * 2 }
			{ ...paint }
		/>
	) : (
		<circle cx={ cx } cy={ cy } r={ COMPARISON_MARKER_SIZE } { ...paint } />
	);
};
