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
 * The metric name for each tooltip row: the drawn series' own, plus each extra
 * the chart did not already name, named after itself.
 *
 * @param seriesNames - The drawn series' names, keyed by series label.
 * @param extras      - The series to read out without drawing.
 * @return The names keyed by row key.
 */
export function resolveTooltipNames(
	seriesNames: Map< string, string >,
	extras: readonly TooltipExtraSeries[] | undefined
): Map< string, string > {
	if ( ! extras?.length ) {
		return seriesNames;
	}

	const names = new Map( seriesNames );
	extras.forEach( extra => {
		if ( ! names.has( extra.label ) ) {
			names.set( extra.label, extra.label );
		}
	} );

	return names;
}
