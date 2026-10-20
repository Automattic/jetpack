import {
	LOG_DAYS_PARAM,
	LOG_ENTRY_PARAM,
	LOG_ORIGIN_PARAM,
	LOG_SEARCH_PARAM,
	LOG_SOURCE_PARAM,
	LOG_STATUS_PARAM,
} from '../../data/log-link';
import { cleanSearch } from '../../data/log-query';
import { periodSearch } from '../../data/period';
import type { LogRow, LogSource, Period } from '../../data/types';
import type { Filter, View } from '@wordpress/dataviews';

/** Where a link came from (`from=setup`); read by nothing, so it leaves the address on landing. */
export const FROM_PARAM = 'from';

// Params a link lands with that the Log rewrites: `days` becomes `range` or custom days.
export const LANDING_PARAMS = [ FROM_PARAM, LOG_DAYS_PARAM ];

const STATUSES: LogRow[ 'status' ][] = [ 'sent', 'fallback', 'failed' ];
const SOURCES: LogSource[] = [ 'wp_mail', 'test', 'resend' ];
// The origin keys the server accepts.
const ORIGIN = /^(?:core(?::[a-z_]+)?|plugin:[A-Za-z0-9._-]+|theme:[A-Za-z0-9._-]+)$/;

// The filters the address holds: DataViews field, param, and the values the server takes.
const LIST_PARAMS: [ string, string, ( value: string ) => boolean ][] = [
	[ 'status', LOG_STATUS_PARAM, value => STATUSES.includes( value as LogRow[ 'status' ] ) ],
	[ 'origin', LOG_ORIGIN_PARAM, value => ORIGIN.test( value ) ],
	[ 'source', LOG_SOURCE_PARAM, value => SOURCES.includes( value as LogSource ) ],
];

/**
 * A search param as text. The router parses values as JSON, so `search=1048` arrives as a number
 * and `true` or `null` as other types; arrays and objects aren't text anyone typed.
 *
 * @param value - The parsed value.
 * @return The text, or ''.
 */
function paramText( value: unknown ): string {
	if ( typeof value === 'string' ) {
		return value;
	}
	if ( typeof value === 'number' || typeof value === 'boolean' ) {
		return String( value );
	}
	return value === null ? 'null' : '';
}

/**
 * A comma list from the address, keeping known values once each. Only text is read: a list the
 * router parsed as JSON wasn't written by a link.
 *
 * @param value   - The param's value.
 * @param allowed - Whether a value is one the server takes.
 * @return The values.
 */
function paramList( value: unknown, allowed: ( value: string ) => boolean ): string[] {
	if ( typeof value !== 'string' ) {
		return [];
	}
	return [ ...new Set( value.split( ',' ).map( part => part.trim() ) ) ].filter(
		part => part && allowed( part )
	);
}

/**
 * The Log's search text and filters from its address.
 *
 * @param search - The route's search params.
 * @return The text and DataViews filters (each `isAny`).
 */
export function viewFromSearch( search: Record< string, unknown > | undefined ): {
	search: string;
	filters: Filter[];
} {
	const filters: Filter[] = [];
	LIST_PARAMS.forEach( ( [ field, param, allowed ] ) => {
		const value = paramList( search?.[ param ], allowed );
		if ( value.length ) {
			filters.push( { field, operator: 'isAny', value } );
		}
	} );
	return { search: paramText( search?.[ LOG_SEARCH_PARAM ] ), filters };
}

/**
 * One filter's chosen values.
 *
 * @param view  - The view.
 * @param field - The field id.
 * @return The values; an older `is` filter's single value as a list.
 */
function filterValues( view: Pick< View, 'filters' >, field: string ): string[] {
	const value = view.filters?.find( filter => filter.field === field )?.value;
	const values: unknown[] = Array.isArray( value ) ? value : [ value ];
	return values.filter( ( item ): item is string => typeof item === 'string' && item !== '' );
}

/**
 * The address for the Log's search, filters and period, plus the open email. Every key the Log
 * owns is listed, so cleared ones leave the address.
 *
 * @param view   - The view; only `search` and `filters` are read.
 * @param period - The date control's period; null for any date.
 * @param entry  - The open email's id; '' for none.
 * @return Search params for `navigate( { search } )`.
 */
export function searchFromView(
	view: Pick< View, 'search' | 'filters' >,
	period: Period | null,
	entry: string
): Record< string, string | number | undefined > {
	const params: Record< string, string | number | undefined > = {
		[ LOG_SEARCH_PARAM ]: cleanSearch( view.search ) || undefined,
	};
	LIST_PARAMS.forEach( ( [ field, param, allowed ] ) => {
		const values = filterValues( view, field ).filter( allowed );
		params[ param ] = values.length ? values.join( ',' ) : undefined;
	} );
	return {
		...params,
		...periodSearch( period, null ),
		[ FROM_PARAM ]: undefined,
		// A number, as `/log?entry=12` parses, so the address doesn't quote it.
		[ LOG_ENTRY_PARAM ]: /^\d+$/.test( entry ) ? Number( entry ) : entry || undefined,
	};
}

/**
 * A string that changes only when what the address says about the list changes.
 *
 * @param view   - The view.
 * @param period - The period.
 * @return The key.
 */
export function urlKey( view: Pick< View, 'search' | 'filters' >, period: Period | null ): string {
	return JSON.stringify( searchFromView( view, period, '' ) );
}
