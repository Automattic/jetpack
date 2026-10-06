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
	/** The comparison bucket's own date, formatted, when any row has a comparison. */
	previousDate?: string;
	rows: DatedTooltipRow[];
};

type TooltipData = {
	datumByKey?: Record< string, unknown >;
	nearestDatum?: { datum?: unknown };
};

export type DatedTooltipModelOptions = {
	tooltipData: TooltipData | undefined;
	/** The chart's series, in the order the styles follow. */
	series: readonly ComparativeLineChartSeries[];
	seriesStyles: readonly TooltipStyle[];
	/** Series read out at the hovered date without being drawn. */
	extras?: readonly TooltipExtraSeries[];
	dataFormat: DataFormat;
	formatDate: ( date: Date ) => string;
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
	// Every point sits on the current period's axis date; a comparison point keeps
	// its own date in `realDate`, so the header reads `date` whichever is nearest.
	const hoveredDate =
		( tooltipData?.nearestDatum?.datum as Point | undefined )?.date ??
		( entries[ 0 ]?.datum as Point | undefined )?.date;

	if ( ! entries.length || ! hoveredDate ) {
		return null;
	}

	const hoveredTime = hoveredDate.getTime();
	const primaryByGroup = resolvePrimarySeriesByGroup( series );
	const styleOf = ( label: string ): TooltipStyle =>
		seriesStyles[ series.findIndex( s => s.label === label ) ] ?? seriesStyles[ 0 ];
	const rows = new Map< string, DatedTooltipRow >();
	let previousDate: Date | undefined;

	// Current-period rows first, so a comparison always finds its row.
	for ( const entry of entries ) {
		const drawn = series.find( s => s.label === entry.key );
		if ( drawn?.options?.type === 'comparison' ) {
			continue;
		}

		rows.set( entry.key, {
			key: entry.key,
			name: entry.key,
			countLabel: drawn?.countLabel,
			dataFormat,
			indicator: drawn ? { kind: 'series', style: styleOf( drawn.label ) } : { kind: 'blank' },
			value: readingOf( entry.datum as Point ),
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

		const point = entry.datum as Point;
		row.previous = {
			value: readingOf( point ),
			indicator: { kind: 'series', style: styleOf( drawn.label ) },
		};
		previousDate ??= point.realDate ?? point.date;
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
		rows.set( extra.label, {
			key: extra.label,
			name: extra.label,
			countLabel: extra.countLabel,
			dataFormat: extra.dataFormat ?? dataFormat,
			indicator,
			value: readingOf( point ),
			previous: previous && { value: readingOf( previous ), indicator },
		} );
		if ( previous ) {
			previousDate ??= previous.realDate ?? previous.date;
		}
	} );

	return {
		date: formatDate( hoveredDate ),
		previousDate: previousDate && formatDate( previousDate ),
		rows: [ ...rows.values() ],
	};
}
