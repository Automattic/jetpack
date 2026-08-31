import { SOCIAL_SERVICE_META, matchSocialService } from './social-services';
import type { Connection, TrafficReferrerDay, TrafficReferrerRow } from '../social-store/types';

export type TrafficSeries = {
	label: string;
	data: { date: Date; value: number }[];
	options?: { stroke?: string };
};

/**
 * Walk a day's referrer rows and collect every `[ service, total ]`
 * contribution. Rows that match a social service are attributed at that
 * level and not descended into (the row `total` already aggregates its
 * children, so descending would double-count). Rows that don't match —
 * typically group containers like "Search Engines" — are traversed so
 * social hosts nested under a non-social container still surface.
 *
 * @param rows - Referrer rows for a single day (top-level or nested).
 * @param out  - Accumulator the matched contributions are pushed onto.
 */
function collectContributions(
	rows: TrafficReferrerRow[],
	out: Array< [ string, number ] >
): void {
	for ( const row of rows ) {
		const target = row.url ?? row.name ?? '';
		const service = matchSocialService( target );
		if ( service ) {
			const total = Number( row.total ?? 0 );
			if ( Number.isFinite( total ) ) {
				out.push( [ service, total ] );
			}
			continue;
		}
		if ( row.results?.length ) {
			collectContributions( row.results, out );
		}
	}
}

/**
 * Reduce a `days` map from the referrers endpoint into one chart series
 * per matched social-service host. Every social referrer renders even
 * if the user hasn't connected that service via Publicize — surfacing a
 * Facebook line on a site that only auto-shares to LinkedIn is a useful
 * discovery cue ("you're already getting traffic here; connect to
 * lean in"), not noise. The Publicize connections list is consulted
 * only to pick a nicer legend label when it's available.
 *
 * Days are sorted ascending so the line draws left to right regardless
 * of the API ordering. Services with zero total over the window are
 * dropped so the legend stays focused on what's actually driving
 * visits.
 *
 * @param days        - Per-day referrer payload keyed by `YYYY-MM-DD`.
 * @param connections - Site's Publicize connections, used to pull a
 *                    human-friendly label for the legend.
 * @return One series per surviving service.
 */
export function buildSeries(
	days: Record< string, TrafficReferrerDay > | undefined,
	connections: Connection[]
): TrafficSeries[] {
	if ( ! days ) {
		return [];
	}

	const dates = Object.keys( days ).sort();
	if ( dates.length === 0 ) {
		return [];
	}

	const buckets = new Map< string, Map< string, number > >();
	for ( const date of dates ) {
		const contributions: Array< [ string, number ] > = [];
		collectContributions( days[ date ]?.groups ?? [], contributions );
		for ( const [ service, total ] of contributions ) {
			const byDate = buckets.get( service ) ?? new Map< string, number >();
			byDate.set( date, ( byDate.get( date ) ?? 0 ) + total );
			buckets.set( service, byDate );
		}
	}

	const series: TrafficSeries[] = [];
	for ( const [ service, byDate ] of buckets ) {
		const total = Array.from( byDate.values() ).reduce( ( a, b ) => a + b, 0 );
		if ( total === 0 ) {
			continue;
		}
		const data = dates.map( date => ( {
			date: new Date( `${ date }T00:00:00Z` ),
			value: byDate.get( date ) ?? 0,
		} ) );
		const conn = connections.find( c => c.service_name === service );
		const label =
			conn?.service_label ??
			SOCIAL_SERVICE_META[ service ]?.label ??
			service.replace( /^./, c => c.toUpperCase() );
		series.push( {
			label,
			data,
			options: { stroke: SOCIAL_SERVICE_META[ service ]?.stroke },
		} );
	}

	return series;
}
