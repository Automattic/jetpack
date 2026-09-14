/**
 * Internal dependencies
 */
import type {
	ComparativeDatePointDate,
	TooltipExtraSeries,
} from '../components/chart-comparative-line/types';
import type { DataFormat } from '../types';

type TooltipData = {
	datumByKey?: Record< string, unknown >;
	nearestDatum?: { datum?: unknown };
};

/**
 * Append each extra series' point for the hovered date to the tooltip rows. A
 * key the chart already reports is left alone, so a series that is both drawn
 * and listed shows once.
 *
 * @param tooltipData - The tooltip data from the chart.
 * @param extras      - The series to read out without drawing.
 * @param indexOffset - Row index of the first extra, after the drawn series.
 * @return The same data with the extras' rows appended.
 */
export function appendTooltipExtras< T extends TooltipData >(
	tooltipData: T | undefined,
	extras: readonly TooltipExtraSeries[] | undefined,
	indexOffset: number
): T | undefined {
	const datumByKey = tooltipData?.datumByKey;
	const hovered = tooltipData?.nearestDatum?.datum as ComparativeDatePointDate | undefined;

	if ( ! extras?.length || ! datumByKey || ! hovered?.date ) {
		return tooltipData;
	}

	// Comparison points carry their primary's date, so the hovered bucket is `date`
	// on every series, never `realDate`.
	const hoveredTime = hovered.date.getTime();
	const augmented = { ...datumByKey };

	extras.forEach( ( extra, offset ) => {
		if ( augmented[ extra.label ] ) {
			return;
		}

		const point = extra.data.find( candidate => candidate.date.getTime() === hoveredTime );

		if ( point?.value != null ) {
			augmented[ extra.label ] = { datum: point, index: indexOffset + offset, key: extra.label };
		}
	} );

	return { ...tooltipData, datumByKey: augmented };
}

/**
 * The extras as `ChartTooltip`'s supplementary rows: keyed by label, carrying
 * each one's own format.
 *
 * @param extras - The series to read out without drawing.
 * @return The supplementary-row map, or undefined when there are no extras.
 */
export function supplementaryRowsFor(
	extras: readonly TooltipExtraSeries[] | undefined
): Record< string, DataFormat | undefined > | undefined {
	if ( ! extras?.length ) {
		return undefined;
	}

	return Object.fromEntries( extras.map( extra => [ extra.label, extra.dataFormat ] ) );
}
