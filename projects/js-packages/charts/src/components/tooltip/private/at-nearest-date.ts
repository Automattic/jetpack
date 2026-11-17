import type { AxisScale } from '@visx/axis';
import type { DataRegistryEntry, TooltipContextType } from '@visx/xychart';

type TooltipData< Datum extends object > = TooltipContextType< Datum >[ 'tooltipData' ];

type Registry< Datum extends object > = {
	entries: () => DataRegistryEntry< AxisScale, AxisScale, Datum >[];
};

const timeOf = ( datum: object ): number | undefined =>
	( datum as { date?: Date } ).date?.getTime();

/**
 * Lists every registered series at the nearest datum's date, each with its own point there.
 *
 * The pointer hands each series its own nearest point, which for a series that skips that date, or that the pointer sits nearer another date of, is a neighbor's.
 *
 * @param tooltipData - The tooltip data visx collected.
 * @param registry    - The chart's data registry.
 * @return The tooltip data, unchanged when the nearest datum has no date.
 */
export const atNearestDate = < Datum extends object >(
	tooltipData: TooltipData< Datum >,
	registry: Registry< Datum > | undefined
): TooltipData< Datum > => {
	const nearest = tooltipData?.nearestDatum?.datum;
	const time = nearest ? timeOf( nearest ) : undefined;

	if ( ! tooltipData || time === undefined ) {
		return tooltipData;
	}

	const datumByKey: NonNullable< TooltipData< Datum > >[ 'datumByKey' ] = {};
	for ( const { key, data } of registry?.entries() ?? [] ) {
		const index = data.findIndex( datum => timeOf( datum ) === time );
		if ( index !== -1 ) {
			datumByKey[ key ] = { key, index, datum: data[ index ] };
		}
	}

	// Stacked series register points without a date, so their own nearest point is kept when it is at that date.
	for ( const [ key, entry ] of Object.entries( tooltipData.datumByKey ) ) {
		if ( ! datumByKey[ key ] && timeOf( entry.datum ) === time ) {
			datumByKey[ key ] = entry;
		}
	}

	return { ...tooltipData, datumByKey };
};
