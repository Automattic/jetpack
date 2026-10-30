import { periodArgs } from './period';
import type { DebugQuery, LogQuery, LogRow, LogSource, Period } from './types';
import type { View } from '@wordpress/dataviews';

/** A shorter search matches too much to be useful, so it searches nothing. */
export const SEARCH_MIN_CHARS = 2;
export const SEARCH_MAX_CHARS = 100;

const STATUSES: LogRow[ 'status' ][] = [ 'sent', 'fallback', 'failed' ];
const SOURCES: LogSource[] = [ 'wp_mail', 'test', 'resend' ];

/**
 * Search text as the server will use it: trimmed, control characters dropped, cut to 100
 * characters, and '' when it's under 2.
 *
 * @param value - The typed text (the router may hand over a number).
 * @return The text, or '' for no search.
 */
export function cleanSearch( value: unknown ): string {
	const raw = typeof value === 'number' ? String( value ) : value;
	if ( typeof raw !== 'string' ) {
		return '';
	}
	const text = Array.from( raw.replace( /\p{Cc}/gu, '' ).trim() );
	return text.length < SEARCH_MIN_CHARS ? '' : text.slice( 0, SEARCH_MAX_CHARS ).join( '' );
}

/**
 * A list without blanks or repeats, keeping only allowed values when a list of them is given.
 *
 * @param values  - The values.
 * @param allowed - The values allowed, if limited.
 * @return The clean list.
 */
function cleanList< T extends string >( values: unknown[] | undefined, allowed?: T[] ): T[] {
	const seen = new Set< T >();
	( values ?? [] ).forEach( value => {
		if ( typeof value === 'string' && value && ( ! allowed || allowed.includes( value as T ) ) ) {
			seen.add( value as T );
		}
	} );
	return [ ...seen ];
}

/**
 * GET /log args for a query: page, search (when long enough), lists as arrays, and the period.
 *
 * @param query - The query.
 * @return Args for `addQueryArgs()`.
 */
export function logQueryArgs( query: LogQuery ): Record< string, unknown > {
	const args: Record< string, unknown > = { page: query.page, per_page: query.per_page };
	const search = cleanSearch( query.search );
	if ( search ) {
		args.search = search;
	}
	const status = cleanList( query.status, STATUSES );
	if ( status.length ) {
		args.status = status;
	}
	const origin = cleanList( query.origin );
	if ( origin.length ) {
		args.origin = origin;
	}
	const source = cleanList( query.source, SOURCES );
	if ( source.length ) {
		args.source = source;
	}
	return { ...args, ...periodArgs( query.period ?? null ) };
}

/**
 * One filter's chosen values; `isAny` holds a list, an older `is` a single value.
 *
 * @param view  - The DataViews view.
 * @param field - The field id.
 * @return The values.
 */
function filterValues( view: View, field: string ): unknown[] {
	const filter = view.filters?.find(
		item => item.field === field && ( item.operator === 'isAny' || item.operator === 'is' )
	);
	if ( ! filter || filter.value === undefined || filter.value === null ) {
		return [];
	}
	return Array.isArray( filter.value ) ? filter.value : [ filter.value ];
}

/**
 * The Log's query from its DataViews view and its date control. Status (`status`), Source
 * (`origin`) and Type (`source`) match any of their values.
 *
 * @param view   - The DataViews view.
 * @param period - The date control's period; null for any date.
 * @return The query.
 */
export function viewToQuery( view: View, period: Period | null ): LogQuery {
	const query: LogQuery = {
		page: view.page ?? 1,
		per_page: view.perPage ?? 20,
		period,
	};
	const search = cleanSearch( view.search );
	if ( search ) {
		query.search = search;
	}
	const status = cleanList( filterValues( view, 'status' ), STATUSES );
	if ( status.length ) {
		query.status = status;
	}
	const origin = cleanList( filterValues( view, 'origin' ) );
	if ( origin.length ) {
		query.origin = origin;
	}
	const source = cleanList( filterValues( view, 'source' ), SOURCES );
	if ( source.length ) {
		query.source = source;
	}
	return query;
}

/**
 * GET /debug-log args (also GET /debug-log/text, which ignores the page).
 *
 * @param query - The debug log query.
 * @return Args for `addQueryArgs()`.
 */
export function debugQueryArgs( query: Partial< DebugQuery > ): Record< string, unknown > {
	const args: Record< string, unknown > = {};
	if ( query.page ) {
		args.page = query.page;
	}
	if ( query.per_page ) {
		args.per_page = query.per_page;
	}
	const search = cleanSearch( query.search );
	if ( search ) {
		args.search = search;
	}
	const level = cleanList( query.level );
	if ( level.length ) {
		args.level = level;
	}
	const area = cleanList( query.area );
	if ( area.length ) {
		args.area = area;
	}
	if ( query.email ) {
		args.email = query.email;
	}
	return args;
}
