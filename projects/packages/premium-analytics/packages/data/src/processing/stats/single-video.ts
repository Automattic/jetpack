import { safeParseFloat } from '../../utils/parsing';
import { coerceStatsArray, coerceStatsRecord, isStatsRecord } from './utils';

export type StatsSingleVideoDataPoint = {
	period: string;
	value: number;
};

export type StatsSingleVideoPage = {
	label: string;
	link: string;
};

export type StatsSingleVideoPost = {
	id?: number;
	title?: string;
	date?: string;
	mimeType?: string;
	/** Photon URL of the video's poster frame; may be tokenless (unusable) for private videos. */
	poster?: string;
};

/**
 * One range-mode series row: the period start plus one value per metric named
 * in the response's `fields`. Calypso keys the metrics directly on the row;
 * they nest under `values` here so `period` keeps its own type.
 */
export type StatsSingleVideoMetricRow = {
	period: string;
	values: Record< string, number >;
};

/** Canonical whole-range totals keyed by metric name (`plays`, `impressions`, `watch_time`, `retention_rate`). */
export type StatsSingleVideoTotals = Record< string, number >;

export type StatsSingleVideoReport = {
	/** The leading metric's series — the `plays`/views column under `statType=all`. */
	data: StatsSingleVideoDataPoint[];
	/** Metric names from `fields` (minus the leading `period`), or null outside range mode. */
	metrics: string[] | null;
	/** Per-period rows keyed by metric name, or null outside range mode. */
	rows: StatsSingleVideoMetricRow[] | null;
	/** Server-computed totals over the requested window, or null when absent. */
	total: StatsSingleVideoTotals | null;
	pages: StatsSingleVideoPage[];
	post: StatsSingleVideoPost | null;
};

function sanitizeSingleVideoPost( value: unknown ): StatsSingleVideoPost | null {
	if ( ! isStatsRecord( value ) ) {
		return null;
	}

	const id = Number( value.ID );

	return {
		...( ( typeof value.ID === 'number' || typeof value.ID === 'string' ) &&
		Number.isInteger( id ) &&
		id > 0
			? { id }
			: {} ),
		...( typeof value.post_title === 'string' ? { title: value.post_title } : {} ),
		...( typeof value.post_date === 'string' ? { date: value.post_date } : {} ),
		...( typeof value.post_mime_type === 'string' ? { mimeType: value.post_mime_type } : {} ),
		...( typeof value.poster === 'string' && value.poster !== '' ? { poster: value.poster } : {} ),
	};
}

export function sanitizeStatsSingleVideoResponse( response: unknown ): StatsSingleVideoReport {
	const payload = coerceStatsRecord( response );
	// When the requested window has no rows at all, the endpoint returns a
	// single `{ date, p }` object instead of the usual tuples; `coerceStatsArray`
	// and the per-row tuple filter both guard against that.
	const tuples = coerceStatsArray< unknown >( payload.data ).filter(
		( row ): row is [ string, ...unknown[] ] =>
			Array.isArray( row ) && row.length >= 2 && typeof row[ 0 ] === 'string'
	);
	const data = tuples.map( ( [ period, value ] ) => ( {
		period,
		value: safeParseFloat( value ),
	} ) );

	// `fields` names the tuple columns after the leading period (one metric for
	// a single statType, four for statType=all). Rows keyed by metric name let
	// consumers pick series without caring about column order.
	const fields = coerceStatsArray< unknown >( payload.fields ).filter(
		( field ): field is string => typeof field === 'string'
	);
	let metrics: string[] | null = null;
	let rows: StatsSingleVideoMetricRow[] | null = null;
	if ( fields.length >= 2 && Array.isArray( payload.data ) ) {
		const metricNames = fields.slice( 1 );
		metrics = metricNames;
		rows = tuples.map( ( [ period, ...cells ] ) => ( {
			period,
			values: Object.fromEntries(
				metricNames.map( ( name, index ) => [ name, safeParseFloat( cells[ index ] ) ] )
			),
		} ) );
	}

	// Range queries also return canonical totals over the window, keyed by
	// metric name.
	const total = isStatsRecord( payload.total )
		? Object.fromEntries(
				Object.entries( payload.total ).map( ( [ metric, value ] ) => [
					metric,
					safeParseFloat( value ),
				] )
		  )
		: null;

	const pages = coerceStatsArray< unknown >( payload.pages )
		.filter( ( page ): page is string => typeof page === 'string' )
		.map( page => ( { label: page, link: page } ) );
	const post = sanitizeSingleVideoPost( payload.post );

	return { data, metrics, rows, total, pages, post };
}
