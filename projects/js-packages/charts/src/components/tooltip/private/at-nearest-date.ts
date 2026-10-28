import type { TooltipContextType } from '@visx/xychart';

type TooltipData< Datum extends object > = TooltipContextType< Datum >[ 'tooltipData' ];

const timeOf = ( datum: object ): number | undefined =>
	( datum as { date?: Date } ).date?.getTime();

/**
 * Keeps only the series that have a point at the nearest datum's date.
 *
 * The pointer hands each series its own nearest point, so a series that skips the hovered date would otherwise report a neighbor's.
 *
 * @param tooltipData - The tooltip data visx collected.
 * @return The tooltip data, unchanged when the nearest datum has no date.
 */
export const atNearestDate = < Datum extends object >(
	tooltipData: TooltipData< Datum >
): TooltipData< Datum > => {
	const nearest = tooltipData?.nearestDatum?.datum;
	const time = nearest ? timeOf( nearest ) : undefined;

	if ( ! tooltipData || time === undefined ) {
		return tooltipData;
	}

	return {
		...tooltipData,
		datumByKey: Object.fromEntries(
			Object.entries( tooltipData.datumByKey ).filter(
				( [ , { datum } ] ) => timeOf( datum ) === time
			)
		),
	};
};
