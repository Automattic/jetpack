import { COMPARISON_LINE_WIDTH } from './overlap-constants';
import type { LineStyles } from '@visx/xychart';
import type { DOMAttributes } from 'react';

// LineSeries types its handlers as visx callbacks and positions the path itself.
export type LinePaint = Omit< LineStyles, keyof DOMAttributes< SVGLineElement > | 'x' | 'y' >;

export const getComparisonLineWidth = ( paint: LinePaint ) => {
	const width = Number( paint.strokeWidth ?? COMPARISON_LINE_WIDTH );
	return Number.isFinite( width ) ? width : COMPARISON_LINE_WIDTH;
};
