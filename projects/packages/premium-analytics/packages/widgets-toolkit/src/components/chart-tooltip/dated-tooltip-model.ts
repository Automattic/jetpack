/**
 * Internal dependencies
 */
import { resolvePrimarySeriesByGroup } from '../../helpers/resolve-series-names';
import { previousRowLabel } from '../../helpers/tooltip-extras';
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

export type DatedTooltipRow = {
	key: string;
	/** The metric's name, read as the value's unit. */
	name: string;
	countLabel?: CountLabel;
	dataFormat: DataFormat;
	indicator: TooltipIndicator;
	/** The current period's reading; null for a bucket with no reading. */
	value: number | null;
	/** The comparison period's reading, with the swatch of its own series. */
	previous?: { value: number | null; style?: TooltipStyle };
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
	extras?: readonly TooltipExtraSeries[];
	dataFormat: DataFormat;
	formatDate: ( date: Date ) => string;
};

function readingOf( datum: unknown ): number | null {
	return ( datum as { value?: number | null } ).value ?? null;
}

function dateOf( datum: unknown ): Date | undefined {
	const point = datum as Partial< ComparativeDatePointDate > | undefined;
	return point?.realDate ?? point?.date;
}

/**
 * Group the tooltip's rows for the hovered bucket: one row per drawn metric or
 * extra, each carrying its comparison reading beside it, under one date.
 *
 * The rows the chart reports are respected as they are, so a series the legend
 * hid stays out; a comparison whose metric is hidden is dropped with it.
 *
 * @param options - The chart's tooltip data and series.
 * @return The model, or null when nothing is hovered.
 */
export function buildDatedTooltipModel(
	options: DatedTooltipModelOptions
): DatedTooltipModel | null {
	const { tooltipData, series, seriesStyles, extras, dataFormat, formatDate } = options;
	const entries = Object.values( tooltipData?.datumByKey ?? {} ).filter( isChartDatumEntry );
	const hoveredDate = dateOf( tooltipData?.nearestDatum?.datum ) ?? dateOf( entries[ 0 ]?.datum );

	if ( ! entries.length || ! hoveredDate ) {
		return null;
	}

	const primaryByGroup = resolvePrimarySeriesByGroup( series );
	const styleOf = ( label: string ) => seriesStyles[ series.findIndex( s => s.label === label ) ];
	const rows = new Map< string, DatedTooltipRow >();
	let previousDate: string | undefined;

	// Current-period rows first, so a comparison always finds its row.
	for ( const entry of entries ) {
		const drawn = series.find( s => s.label === entry.key );
		if ( drawn?.options?.type === 'comparison' || previousRowLabel( entry.key ) ) {
			continue;
		}

		const extra = drawn ? undefined : extras?.find( e => e.label === entry.key );
		let indicator: TooltipIndicator = { kind: 'blank' };
		if ( drawn ) {
			indicator = { kind: 'series', style: styleOf( drawn.label ) };
		} else if ( extra?.icon ) {
			indicator = { kind: 'icon', icon: extra.icon };
		}

		rows.set( entry.key, {
			key: entry.key,
			name: entry.key,
			countLabel: drawn?.countLabel ?? extra?.countLabel,
			dataFormat: extra?.dataFormat ?? dataFormat,
			indicator,
			value: readingOf( entry.datum ),
		} );
	}

	for ( const entry of entries ) {
		const drawn = series.find( s => s.label === entry.key );
		let row: DatedTooltipRow | undefined;
		let style: TooltipStyle | undefined;

		if ( drawn?.options?.type === 'comparison' ) {
			// An ungrouped comparison belongs to the first series, as the chart aligns it.
			const primary = drawn.group !== undefined ? primaryByGroup.get( drawn.group ) : series[ 0 ];
			row = primary && rows.get( primary.label );
			style = styleOf( drawn.label );
		} else {
			const label = previousRowLabel( entry.key );
			row = label === undefined ? undefined : rows.get( label );
		}

		if ( ! row ) {
			continue;
		}

		row.previous = { value: readingOf( entry.datum ), style };
		const date = dateOf( entry.datum );
		if ( previousDate === undefined && date ) {
			previousDate = formatDate( date );
		}
	}

	return { date: formatDate( hoveredDate ), previousDate, rows: [ ...rows.values() ] };
}
