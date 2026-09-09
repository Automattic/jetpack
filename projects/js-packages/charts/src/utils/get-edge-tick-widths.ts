import { getStringWidth } from '@visx/text';
import type { TickFormatter } from '@visx/axis';
import type { AnyD3Scale, ScaleInput } from '@visx/scale';

/**
 * Rendered widths of the first and last tick labels on an axis.
 *
 * An unmeasurable label reserves nothing, which is what a width of 0 already
 * means to every caller, so it is reported as 0 rather than as its own case.
 *
 * @param          ticks      - Tick values, in axis order.
 * @param          formatTick - Function to format a tick.
 * @param {object} labelStyle - Style object for the label.
 * @return {object} - Widths in pixels.
 */
export const getEdgeTickWidths = < T extends AnyD3Scale >(
	ticks: ScaleInput< T >[],
	formatTick?: TickFormatter< ScaleInput< T > >,
	labelStyle?: object
): { first: number; last: number } => {
	if ( ! ticks.length ) {
		return { first: 0, last: 0 };
	}

	const lastIndex = ticks.length - 1;
	const label = ( tick: ScaleInput< T >, index: number ) =>
		String( formatTick ? formatTick( tick, index, [] ) ?? '' : tick );

	return {
		first: getStringWidth( label( ticks[ 0 ], 0 ), labelStyle ) ?? 0,
		last: getStringWidth( label( ticks[ lastIndex ], lastIndex ), labelStyle ) ?? 0,
	};
};
