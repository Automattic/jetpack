import type { ScanThreat } from './types';

/** The search param listing the threats a report shows, such as the ones in a threat email. */
export const REPORT_PARAM = 'threats';

const MAX_IDS = 50;

/**
 * The threat ids in the report param, in order and without duplicates.
 *
 * @param value - The param's value; the router parses a lone id as a number.
 * @return The ids.
 */
export function parseThreatIds( value: unknown ): string[] {
	if ( typeof value !== 'string' && typeof value !== 'number' ) {
		return [];
	}
	const ids = String( value )
		.split( ',' )
		.map( id => id.trim() )
		.filter( id => /^\d+$/.test( id ) );
	return [ ...new Set( ids ) ].slice( 0, MAX_IDS );
}

export type ThreatGroups = {
	active: ScanThreat[];
	fixed: ScanThreat[];
	ignored: ScanThreat[];
	/** Ids Scan reports nowhere, such as a vulnerability gone after an update. */
	notFound: string[];
	/** Ids whose status is unknown while the active list or Scan history is. */
	pending: string[];
};

type ThreatSources = {
	/** The active threats, or null when Scan's report failed. */
	active: ScanThreat[] | null;
	/** The ignored list the client holds, which a history load fills in; newer than history's. */
	ignored: ScanThreat[] | undefined;
	/** Scan history, or null while it loads or after it failed. */
	history: ScanThreat[] | null;
};

/**
 * Sort a report's threats by where Scan has them now, keeping the requested order in each group.
 *
 * @param ids     - The requested threat ids.
 * @param sources - The active threats, the ignored list and Scan history.
 * @return The groups.
 */
export function groupThreats( ids: string[], sources: ThreatSources ): ThreatGroups {
	const { active, ignored, history } = sources;
	const byId = ( threats: ScanThreat[] ) =>
		new Map( threats.map( item => [ String( item.id ), item ] ) );
	const activeById = byId( active ?? [] );
	const ignoredById = byId( ignored ?? history?.filter( item => item.status === 'ignored' ) ?? [] );
	const fixedById = byId( history?.filter( item => item.status === 'fixed' ) ?? [] );

	const groups: ThreatGroups = { active: [], fixed: [], ignored: [], notFound: [], pending: [] };
	// Do not reorder: a threat fixed or ignored, then found again, is active.
	const lists = [
		[ activeById, groups.active ],
		[ ignoredById, groups.ignored ],
		[ fixedById, groups.fixed ],
	] as const;
	for ( const id of ids ) {
		const list = lists.find( ( [ map ] ) => map.has( id ) );
		if ( list ) {
			list[ 1 ].push( list[ 0 ].get( id ) as ScanThreat );
		} else {
			( history && active ? groups.notFound : groups.pending ).push( id );
		}
	}
	return groups;
}
