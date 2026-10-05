/**
 * Internal dependencies
 */
import type {
	ComparativeDatePointDate,
	TooltipExtraSeries,
} from '../components/chart-comparative-line/types';

type TooltipData = {
	datumByKey?: Record< string, unknown >;
	nearestDatum?: { datum?: unknown };
};

const PREVIOUS_ROW_SUFFIX = '\u0000previous';

/** Row key of an extra's comparison row; `previousRowLabel` maps it back. */
export function previousRowKey( label: string ): string {
	return `${ label }${ PREVIOUS_ROW_SUFFIX }`;
}

/**
 * The label a comparison row key was made from, or undefined for any other key.
 *
 * @param key - A tooltip row key.
 * @return The extra's label.
 */
export function previousRowLabel( key: string ): string | undefined {
	return key.endsWith( PREVIOUS_ROW_SUFFIX )
		? key.slice( 0, -PREVIOUS_ROW_SUFFIX.length )
		: undefined;
}

/**
 * Append each extra series' point for the hovered date to the tooltip rows,
 * its comparison point right after it. A label the chart already reports is
 * left alone, so a drawn series keeps its own row when it is also listed.
 *
 * @param tooltipData - The tooltip data from the chart.
 * @param extras      - The series to read out without drawing.
 * @return The data with the extras' rows appended.
 */
export function appendTooltipExtras< T extends TooltipData >(
	tooltipData: T | undefined,
	extras: readonly TooltipExtraSeries[] | undefined
): T | undefined {
	const datumByKey = tooltipData?.datumByKey;
	const hovered = tooltipData?.nearestDatum?.datum as ComparativeDatePointDate | undefined;

	if ( ! extras?.length || ! datumByKey || ! hovered?.date ) {
		return tooltipData;
	}

	const hoveredTime = hovered.date.getTime();
	const augmented = { ...datumByKey };

	extras.forEach( ( extra, offset ) => {
		if ( augmented[ extra.label ] ) {
			return;
		}

		const point = extra.data.find( candidate => candidate.date.getTime() === hoveredTime );

		// A point with a null value still gets its row, which the tooltip reads as "No data".
		if ( point ) {
			// `index` only has to exist for the row shape; the tooltip orders rows itself.
			augmented[ extra.label ] = { datum: point, index: offset, key: extra.label };
		}

		const previous = extra.previous?.find( candidate => candidate.date.getTime() === hoveredTime );

		if ( previous ) {
			const key = previousRowKey( extra.label );
			augmented[ key ] = { datum: previous, index: offset, key };
		}
	} );

	return { ...tooltipData, datumByKey: augmented };
}
