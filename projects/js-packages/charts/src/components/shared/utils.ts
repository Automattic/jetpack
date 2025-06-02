import { TickFormatter } from '@visx/axis';
import { AnyD3Scale, ScaleInput } from '@visx/scale';
import { getStringWidth } from '@visx/text';

/**
 * Returns the width of the longest tick.
 *
 * @param          ticks      - Ticks to get the width of.
 * @param          formatTick - Function to format the tick.
 * @param {object} labelStyle - Style object for the label.
 * @return {number} - Width of the longest tick.
 */
export const getLongestTickWidth = < T extends AnyD3Scale >(
	ticks: ScaleInput< T >[],
	formatTick: TickFormatter< ScaleInput< T > >,
	labelStyle?: object
) => {
	const formattedTicks = ticks.map( tick => formatTick( tick, 0, [] ) );
	const longestTick = formattedTicks.reduce(
		( longest, current ) => ( longest.length >= current.length ? longest : current ),
		formattedTicks[ 0 ]
	);

	return getStringWidth( longestTick, labelStyle );
};
