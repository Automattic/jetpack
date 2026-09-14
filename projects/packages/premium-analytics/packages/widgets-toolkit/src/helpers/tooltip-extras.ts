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

export type TooltipExtrasResult< T extends TooltipData > = {
	tooltipData: T | undefined;
	/**
	 * `ChartTooltip`'s supplementary rows: the extras this call appended, keyed
	 * by label with each one's format. A label the chart already reported is not
	 * here, so a drawn series keeps its swatch even when it is also listed.
	 */
	supplementaryRows: Record< string, DataFormat | undefined > | undefined;
};

/**
 * Append each extra series' point for the hovered date to the tooltip rows,
 * and report which extras were appended.
 *
 * @param tooltipData - The tooltip data from the chart.
 * @param extras      - The series to read out without drawing.
 * @return The data with the extras' rows appended, and the rows to mark supplementary.
 */
export function appendTooltipExtras< T extends TooltipData >(
	tooltipData: T | undefined,
	extras: readonly TooltipExtraSeries[] | undefined
): TooltipExtrasResult< T > {
	const datumByKey = tooltipData?.datumByKey;
	const hovered = tooltipData?.nearestDatum?.datum as ComparativeDatePointDate | undefined;

	if ( ! extras?.length || ! datumByKey || ! hovered?.date ) {
		return { tooltipData, supplementaryRows: undefined };
	}

	// Comparison points carry their primary's date, so the hovered bucket is `date`
	// on every series, never `realDate`.
	const hoveredTime = hovered.date.getTime();
	const augmented = { ...datumByKey };
	const supplementaryRows: Record< string, DataFormat | undefined > = {};

	extras.forEach( ( extra, offset ) => {
		if ( augmented[ extra.label ] ) {
			return;
		}

		const point = extra.data.find( candidate => candidate.date.getTime() === hoveredTime );

		if ( point?.value != null ) {
			// `index` only has to exist for the row shape; the tooltip orders rows itself.
			augmented[ extra.label ] = { datum: point, index: offset, key: extra.label };
			supplementaryRows[ extra.label ] = extra.dataFormat;
		}
	} );

	return {
		tooltipData: { ...tooltipData, datumByKey: augmented },
		supplementaryRows: Object.keys( supplementaryRows ).length ? supplementaryRows : undefined,
	};
}

/**
 * The names the tooltip leads each row with once extras join the drawn series:
 * an extra is named after itself, and with any present the drawn rows are
 * named too, so a date alone never labels two rows identically.
 *
 * @param seriesNames - The drawn series' names, keyed by series label.
 * @param isPaired    - Whether the chart draws more than one metric.
 * @param extras      - The series to read out without drawing.
 * @return The names keyed by row key, and whether rows lead with a name.
 */
export function resolveTooltipNames(
	seriesNames: Map< string, string >,
	isPaired: boolean,
	extras: readonly TooltipExtraSeries[] | undefined
): { names: Map< string, string >; namesRows: boolean } {
	if ( ! extras?.length ) {
		return { names: seriesNames, namesRows: isPaired };
	}

	const names = new Map( seriesNames );
	extras.forEach( extra => names.set( extra.label, extra.label ) );

	return { names, namesRows: true };
}
