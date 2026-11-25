import { periodArgs } from './period';
import type { LogRow, LogSource, Period } from './types';

/** Search param that opens one email in the Log's side panel. */
export const LOG_ENTRY_PARAM = 'entry';

/**
 * The email a search param names; the router parses `entry=12` as a number, so both are read.
 *
 * @param value - The param's value.
 * @return The log id, or '' for none.
 */
export function entryId( value: unknown ): string {
	return typeof value === 'string' || typeof value === 'number' ? String( value ) : '';
}

/**
 * In-app href for the Log with one email open in its side panel; pass to `useNavigate()( { href } )`.
 *
 * @param logId - Log row id.
 * @return The href.
 */
export function logEntryHref( logId: string ): string {
	return `/log?${ LOG_ENTRY_PARAM }=${ encodeURIComponent( logId ) }`;
}

/** The Settings route, and the param that opens its sender form on arrival (`?edit=sender`). */
export const SETTINGS_HREF = '/settings';
export const SETTINGS_EDIT_PARAM = 'edit';

/** In-app href for Settings with the sender form already open, for "Change sender". */
export const SENDER_EDIT_HREF = `${ SETTINGS_HREF }?${ SETTINGS_EDIT_PARAM }=sender`;

/** Search params the Log reads and writes: its search, status, Source (`origin`) and Type (`source`). */
export const LOG_SEARCH_PARAM = 'search';
export const LOG_STATUS_PARAM = 'status';
export const LOG_ORIGIN_PARAM = 'origin';
export const LOG_SOURCE_PARAM = 'source';
/** Older links' "last N days"; the Log reads it on landing, then writes the period instead. */
export const LOG_DAYS_PARAM = 'days';

/** Where the Settings screens open on arrival, for the links that send people there. */
export const EMAIL_LOG_SETTINGS_HREF = `${ SETTINGS_HREF }?${ SETTINGS_EDIT_PARAM }=log`;
export const ADVANCED_SETTINGS_HREF = `${ SETTINGS_HREF }?${ SETTINGS_EDIT_PARAM }=advanced`;
export const DEBUG_SETTINGS_HREF = `${ SETTINGS_HREF }?${ SETTINGS_EDIT_PARAM }=debug`;

/** The debug log, and its params: the entry open in its panel, and one email's entries only. */
export const DEBUG_LOG_HREF = '/debug-log';
export const DEBUG_EVENT_PARAM = 'event';
export const DEBUG_EMAIL_PARAM = 'email';

/**
 * A comma-joined list for a link, with each value encoded but the commas kept readable.
 *
 * @param values - The values.
 * @return The list.
 */
const joinParam = ( values: string[] ) => values.map( encodeURIComponent ).join( ',' );

/**
 * In-app href for the Log filtered the way an Overview number counted, e.g. the failed site emails
 * and resends in the dashboard's period.
 *
 * @param status         - One status, or several.
 * @param options        - More filters.
 * @param options.source - Types, e.g. `[ 'wp_mail', 'resend' ]`.
 * @param options.period - The period; null or absent for any date.
 * @param options.origin - Origin keys.
 * @return The href.
 */
export function logStatusHref(
	status: LogRow[ 'status' ] | LogRow[ 'status' ][],
	{
		source = [],
		period = null,
		origin = [],
	}: { source?: LogSource[]; period?: Period | null; origin?: string[] } = {}
): string {
	const parts = [ `${ LOG_STATUS_PARAM }=${ joinParam( ( [] as string[] ).concat( status ) ) }` ];
	if ( origin.length ) {
		parts.push( `${ LOG_ORIGIN_PARAM }=${ joinParam( origin ) }` );
	}
	if ( source.length ) {
		parts.push( `${ LOG_SOURCE_PARAM }=${ joinParam( source ) }` );
	}
	Object.entries( periodArgs( period ) ).forEach( ( [ key, value ] ) =>
		parts.push( `${ key }=${ encodeURIComponent( String( value ) ) }` )
	);
	return `/log?${ parts.join( '&' ) }`;
}

/**
 * In-app href for the debug log, optionally showing one email's entries or with one entry open.
 *
 * @param options       - Options.
 * @param options.email - A log id: only that email's entries.
 * @param options.event - A debug entry id to open in the panel.
 * @return The href.
 */
export function debugLogHref( { email, event }: { email?: string; event?: string } = {} ): string {
	const parts: string[] = [];
	if ( email ) {
		parts.push( `${ DEBUG_EMAIL_PARAM }=${ encodeURIComponent( email ) }` );
	}
	if ( event ) {
		parts.push( `${ DEBUG_EVENT_PARAM }=${ encodeURIComponent( event ) }` );
	}
	return parts.length ? `${ DEBUG_LOG_HREF }?${ parts.join( '&' ) }` : DEBUG_LOG_HREF;
}

/**
 * The full wp-admin address of an in-app href, for real links that also open in a new tab.
 *
 * @param href - In-app href, like `/log?entry=12`.
 * @return The address.
 */
export function adminHref( href: string ): string {
	const url = new URL( window.location.href );
	const page = url.searchParams.get( 'page' ) || 'jetpack-send';
	url.search = '';
	url.hash = '';
	url.searchParams.set( 'page', page );
	url.searchParams.set( 'p', href );
	return url.toString();
}
