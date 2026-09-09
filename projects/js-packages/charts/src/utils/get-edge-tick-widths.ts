import { getStringWidth } from '@visx/text';
import type { TickFormatter } from '@visx/axis';
import type { AnyD3Scale, ScaleInput } from '@visx/scale';

/**
 * Rendered widths of the first and last tick labels on an axis.
 *
 * @param          ticks      - Tick values, in axis order.
 * @param          formatTick - Function to format a tick.
 * @param {object} labelStyle - Style object for the label.
 * @return {object} - Widths in pixels, null for a label that cannot be measured.
 */
export const getEdgeTickWidths = < T extends AnyD3Scale >(
	ticks: ScaleInput< T >[],
	formatTick?: TickFormatter< ScaleInput< T > >,
	labelStyle?: object
): { first: number | null; last: number | null } => {
	if ( ! ticks.length ) {
		return { first: null, last: null };
	}

	const lastIndex = ticks.length - 1;
	const label = ( tick: ScaleInput< T >, index: number ) =>
		String( formatTick ? formatTick( tick, index, [] ) ?? '' : tick );

	return {
		first: getStringWidth( label( ticks[ 0 ], 0 ), labelStyle ),
		last: getStringWidth( label( ticks[ lastIndex ], lastIndex ), labelStyle ),
	};
};
