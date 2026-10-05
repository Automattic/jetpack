/**
 * Internal dependencies
 */
import { resolvePrimarySeriesByGroup } from './resolve-series-names';
import type {
	ComparativeDatePointDate,
	ComparativeLineChartSeries,
	TooltipExtraSeries,
} from '../components/chart-comparative-line/types';
import type { CountLabel, DataFormat } from '../types';

type TooltipData = {
	datumByKey?: Record< string, unknown >;
	nearestDatum?: { datum?: unknown };
};

export type TooltipExtrasResult< T extends TooltipData > = {
	tooltipData: T | undefined;
	/**
	 * `ChartTooltip`'s supplementary rows: the extras this call appended, keyed
	 * by row key with each one's format. A label the chart already reported is not
	 * here, so a drawn series keeps its swatch even when it is also listed.
	 */
	supplementaryRows: Record< string, DataFormat | undefined > | undefined;
};

/** Row key of an extra's comparison row; the unit lookup maps it back to the label. */
export function previousRowKey( label: string ): string {
	return `${ label }\u0000previous`;
}

/**
 * Append each extra series' point for the hovered date to the tooltip rows,
 * its comparison point right after it, and report which rows were appended.
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

		// A point with a null value still gets its row, which the tooltip reads as "No data".
		if ( point ) {
			// `index` only has to exist for the row shape; the tooltip orders rows itself.
			augmented[ extra.label ] = { datum: point, index: offset, key: extra.label };
			supplementaryRows[ extra.label ] = extra.dataFormat;
		}

		const previous = extra.previous?.find( candidate => candidate.date.getTime() === hoveredTime );

		if ( previous ) {
			const key = previousRowKey( extra.label );
			augmented[ key ] = { datum: previous, index: offset, key };
			supplementaryRows[ key ] = extra.dataFormat;
		}
	} );

	return {
		tooltipData: { ...tooltipData, datumByKey: augmented },
		supplementaryRows: Object.keys( supplementaryRows ).length ? supplementaryRows : undefined,
	};
}

/** What a tooltip row reads after its value. */
export type TooltipUnit = {
	name: string;
	countLabel?: CountLabel;
};

/**
 * The unit for each tooltip row, keyed by row key. A comparison row reads its
 * group's current period ('Visitors', not 'Visitors · previous period'); an
 * extra the chart does not draw reads itself.
 *
 * @param series - The series the chart was handed.
 * @param extras - The series to read out without drawing.
 * @return The units keyed by row key.
 */
export function resolveTooltipUnits(
	series: readonly ComparativeLineChartSeries[],
	extras: readonly TooltipExtraSeries[] | undefined
): Map< string, TooltipUnit > {
	const primarySeriesByGroup = resolvePrimarySeriesByGroup( series );
	const units = new Map< string, TooltipUnit >();

	for ( const item of series ) {
		const source = ( item.group !== undefined && primarySeriesByGroup.get( item.group ) ) || item;
		units.set( item.label, { name: source.label, countLabel: source.countLabel } );
	}

	extras?.forEach( extra => {
		if ( ! units.has( extra.label ) ) {
			const unit = { name: extra.label, countLabel: extra.countLabel };
			units.set( extra.label, unit );
			units.set( previousRowKey( extra.label ), unit );
		}
	} );

	return units;
}
