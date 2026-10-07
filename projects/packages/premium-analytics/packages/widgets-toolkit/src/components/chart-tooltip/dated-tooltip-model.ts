/**
 * Internal dependencies
 */
import { resolvePrimarySeriesByGroup } from '../../helpers/resolve-series-names';
import { isChartDatumEntry } from './utils';
import type { TooltipStyle } from './chart-tooltip';
import type { CountLabel, DataFormat } from '../../types';
import type {
	ComparativeDatePointDate,
	ComparativeLineChartSeries,
	TooltipExtraSeries,
} from '../chart-comparative-line/types';
import type { ReactElement } from 'react';

/** What marks a row: the swatch of a drawn series, an icon, or nothing. */
export type TooltipIndicator =
	| { kind: 'series'; style: TooltipStyle }
	| { kind: 'icon'; icon: ReactElement }
	| { kind: 'blank' };

/** A reading: null for a bucket with no reading. */
export type TooltipReading = {
	value: number | null;
	indicator: TooltipIndicator;
};

export type DatedTooltipRow = TooltipReading & {
	key: string;
	/** The metric's name, read as the value's unit. */
	name: string;
	countLabel?: CountLabel;
	dataFormat: DataFormat;
	/** The comparison period's reading, with the swatch of its own series. */
	previous?: TooltipReading;
};

export type DatedTooltipModel = {
	/** The hovered bucket's date, formatted. */
	date: string;
	/**
	 * The comparison bucket's own date, formatted. Unset when no comparison point
	 * sits on the hovered bucket, though a row may still carry an empty comparison.
	 */
	previousDate?: string;
	rows: DatedTooltipRow[];
	/** Why the bucket has no reading, from the first hovered point that says so. */
	note?: string;
};

type TooltipData = {
	datumByKey?: Record< string, unknown >;
};

export type DatedTooltipModelOptions = {
	tooltipData: TooltipData | undefined;
	/** The chart's series, in the order the styles follow. */
	series: readonly ComparativeLineChartSeries[];
	seriesStyles: readonly TooltipStyle[];
	/** Series read out at the hovered date without being drawn. */
	extras?: readonly TooltipExtraSeries[];
	dataFormat: DataFormat;
	/** Names a point's bucket: the hovered current point for the header, a comparison point for its column. */
	formatDate: ( point: ComparativeDatePointDate ) => string;
};

type Point = Partial< ComparativeDatePointDate >;

function readingOf( point: Point | undefined ): number | null {
	return point?.value ?? null;
}

/**
 * Group the tooltip's rows for the hovered bucket: one row per drawn metric or
 * extra, each carrying its comparison reading beside it, under one date.
 *
 * The rows the chart reports are respected as they are, so a series the legend
 * hid stays out; a comparison whose metric is hidden is dropped with it. Extras
 * are read at the hovered date from their own points.
 *
 * @param options - The chart's tooltip data and series.
 * @return The model, or null when nothing is hovered.
 */
export function buildDatedTooltipModel(
	options: DatedTooltipModelOptions
): DatedTooltipModel | null {
	const { tooltipData, series, seriesStyles, extras, dataFormat, formatDate } = options;
	const entries = Object.values( tooltipData?.datumByKey ?? {} ).filter( isChartDatumEntry );
	const isComparison = ( key: string ) =>
		series.find( s => s.label === key )?.options?.type === 'comparison';
	// visx reports each line's nearest point however far it sits, so a comparison
	// point can come from another bucket when its period is shorter. The header
	// reads a current-period point, which always sits on the hovered bucket.
	const hoveredPoint = ( entries.find( e => ! isComparison( e.key ) ) ?? entries[ 0 ] )?.datum as
		Point | undefined;

	if ( ! hoveredPoint?.date ) {
		return null;
	}

	const hoveredTime = hoveredPoint.date.getTime();
	const primaryByGroup = resolvePrimarySeriesByGroup( series );
	const styleOf = ( label: string ): TooltipStyle =>
		seriesStyles[ series.findIndex( s => s.label === label ) ] ?? seriesStyles[ 0 ];
	const rows = new Map< string, DatedTooltipRow >();
	let previousPoint: Point | undefined;
	let note: string | undefined;

	// Current-period rows first, so a comparison always finds its row.
	for ( const entry of entries ) {
		const drawn = series.find( s => s.label === entry.key );
		if ( drawn?.options?.type === 'comparison' ) {
			continue;
		}

		const point = entry.datum as Point;
		note ??= point.note;
		rows.set( entry.key, {
			key: entry.key,
			name: entry.key,
			countLabel: drawn?.countLabel,
			dataFormat,
			indicator: drawn ? { kind: 'series', style: styleOf( drawn.label ) } : { kind: 'blank' },
			value: readingOf( point ),
		} );
	}

	for ( const entry of entries ) {
		const drawn = series.find( s => s.label === entry.key );
		if ( drawn?.options?.type !== 'comparison' ) {
			continue;
		}

		// An ungrouped comparison, or one whose group has no current series, belongs
		// to the first series, as `alignSeriesDates` places it.
		const primary =
			( drawn.group !== undefined ? primaryByGroup.get( drawn.group ) : undefined ) ?? series[ 0 ];
		const row = primary && rows.get( primary.label );
		if ( ! row ) {
			continue;
		}

		// A point from another bucket is no reading for this one.
		const point = entry.datum as Point;
		const inBucket = point.date?.getTime() === hoveredTime;
		row.previous = {
			value: inBucket ? readingOf( point ) : null,
			indicator: { kind: 'series', style: styleOf( drawn.label ) },
		};
		// A stand-in for a bucket the comparison lacks carries no own date to head the column.
		if ( inBucket && ( point.realDate !== undefined || point.value != null ) ) {
			previousPoint ??= point;
		}
	}

	extras?.forEach( extra => {
		// A drawn series listed as an extra too keeps its own row and swatch.
		if ( rows.has( extra.label ) ) {
			return;
		}

		const point = extra.data.find( candidate => candidate.date.getTime() === hoveredTime );
		const previous = extra.previous?.find( candidate => candidate.date.getTime() === hoveredTime );
		if ( ! point && ! previous ) {
			return;
		}

		const indicator: TooltipIndicator = extra.icon
			? { kind: 'icon', icon: extra.icon }
			: { kind: 'blank' };
		note ??= point?.note;
		rows.set( extra.label, {
			key: extra.label,
			name: extra.label,
			countLabel: extra.countLabel,
			dataFormat: extra.dataFormat ?? dataFormat,
			indicator,
			value: readingOf( point ),
			previous: previous && { value: readingOf( previous ), indicator },
		} );
		previousPoint ??= previous;
	} );

	return {
		date: formatDate( hoveredPoint as ComparativeDatePointDate ),
		previousDate: previousPoint && formatDate( previousPoint as ComparativeDatePointDate ),
		rows: [ ...rows.values() ],
		note,
	};
}
