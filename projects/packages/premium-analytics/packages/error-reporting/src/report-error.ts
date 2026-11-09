import { getScriptData } from '@automattic/jetpack-script-data';
import { findDashboardFrame } from './dashboard-frame';
import { redactQuery } from './redact-query';
import type { DashboardFrame } from './dashboard-frame';

export type ReportSource = 'boundary' | 'error' | 'unhandledrejection';

interface ThrownDetails {
	message: string;
	name?: string;
	stack?: string;
}

const ENDPOINT = 'https://public-api.wordpress.com/rest/v1.1/js-error';
const BUDGET_KEY = 'jetpack-premium-analytics-error-budget';
const HOUR_MS = 3_600_000;
const HOURLY_LIMIT = 10;
const PAGE_LIMIT = 3;
const MESSAGE_LIMIT = 1000;
const TRACE_LIMIT = 8000;
const ABSOLUTE_URL = /https?:\/\/[^\s'")]+/g;

interface ErrorProperties {
	source: ReportSource;
	route: string;
	module: string;
	widget: string;
	error_name: string;
	component_stack: string;
	query: Record< string, string >;
}

interface ErrorPayload {
	feature: 'jetpack_stats';
	severity: 'error';
	message: string;
	trace?: string;
	url: string;
	blog_id?: number;
	site_id?: number;
	jetpack_version?: string;
	properties?: Partial< ErrorProperties >;
	extra?: { line?: number; column?: number };
	tags?: string[];
}

const seen = new Set< string >();
let pageCount = 0;
let stoppedHour: number | null = null;

/**
 * Clears the dedupe set, the page counter and the stop flag.
 */
export function resetErrorReporterForTests(): void {
	seen.clear();
	pageCount = 0;
	stoppedHour = null;
}

/**
 * Pulls the fields a report needs out of anything that can be thrown.
 *
 * @param error - The thrown value.
 * @return The message, plus the name and stack when the value has them.
 */
function describeThrown( error: unknown ): ThrownDetails {
	if ( ( typeof error !== 'object' && typeof error !== 'function' ) || error === null ) {
		return { message: String( error ) };
	}

	const { message, name, stack } = error as Record< string, unknown >;

	return {
		message: typeof message === 'string' && message !== '' ? message : 'Non-error thrown',
		name: typeof name === 'string' && name !== '' ? name : undefined,
		stack: typeof stack === 'string' ? stack : undefined,
	};
}

/**
 * Cuts an absolute URL at its first query or hash, keeping a trailing stack position.
 *
 * @param url - An absolute http(s) URL found in free text.
 * @return The URL without its query string or hash.
 */
function redactUrl( url: string ): string {
	const cut = url.search( /[?#]/ );
	if ( cut === -1 ) {
		return url;
	}

	const position = /(?::\d+){1,2}$/.exec( url )?.[ 0 ] ?? '';
	return `${ url.slice( 0, cut ) }${ url[ cut ] }[redacted]${ position }`;
}

/**
 * Removes query strings and hashes from free text, then caps its length.
 *
 * @param text  - A message, stack or component stack.
 * @param limit - The longest text the endpoint should receive.
 * @return The text, safe to send.
 */
function sanitizeText( text: string, limit: number ): string {
	const { search, hash } = window.location;
	let clean = text;

	if ( search ) {
		clean = clean.split( search ).join( '?[redacted]' );
	}
	if ( hash ) {
		clean = clean.split( hash ).join( '#[redacted]' );
	}

	return clean.replace( ABSOLUTE_URL, redactUrl ).slice( 0, limit );
}

/**
 * Drops the members whose value is undefined.
 *
 * @param members - The candidate members.
 * @return The members that have a value, or undefined when none do.
 */
function definedMembers< T extends Record< string, unknown > >(
	members: T
): Partial< T > | undefined {
	const entries = Object.entries( members ).filter( ( [ , value ] ) => value !== undefined );
	return entries.length > 0 ? ( Object.fromEntries( entries ) as Partial< T > ) : undefined;
}

/**
 * Reads the report count of the current hour from the stored budget record.
 *
 * @param raw  - The stored value, if any.
 * @param hour - The current hour bucket.
 * @return The count, or 0 when the record is absent, corrupt or from another hour.
 */
function storedCount( raw: string | null, hour: number ): number {
	let record: { hour?: unknown; count?: unknown } | null = null;
	try {
		record = JSON.parse( raw ?? 'null' );
	} catch {
		// A corrupt record counts as absent so the next write repairs it.
	}

	const count = record?.count;
	return record?.hour === hour &&
		typeof count === 'number' &&
		Number.isInteger( count ) &&
		count >= 0
		? count
		: 0;
}

/**
 * Spends one report from the budget, which is stored per browser and falls back to a per-page cap.
 *
 * @param hour - The current hour bucket.
 * @return Whether a report may be sent.
 */
function spendBudget( hour: number ): boolean {
	if ( stoppedHour === hour ) {
		return false;
	}

	try {
		const count = storedCount( window.localStorage.getItem( BUDGET_KEY ), hour );

		if ( count >= HOURLY_LIMIT ) {
			return false;
		}

		window.localStorage.setItem( BUDGET_KEY, JSON.stringify( { hour, count: count + 1 } ) );
		return true;
	} catch {
		return pageCount++ < PAGE_LIMIT;
	}
}

/**
 * Stops reporting for the rest of the hour, in storage and in memory.
 *
 * @param hour - The hour bucket to stop in.
 */
function stopForHour( hour: number ): void {
	stoppedHour = hour;
	try {
		window.localStorage.setItem( BUDGET_KEY, JSON.stringify( { hour, count: HOURLY_LIMIT } ) );
	} catch {
		// The in-memory flag already stops this page.
	}
}

/**
 * Builds the payload for the js-error endpoint. Only top-level keys the endpoint keeps are allowed.
 *
 * @param details              - The message, name and stack of the thrown value.
 * @param source               - Where the error was caught.
 * @param frame                - The first dashboard frame of the stack, if any.
 * @param extra                - Extra context from the caller.
 * @param extra.componentStack - The React component stack of a boundary catch.
 * @return The payload object.
 */
function buildPayload(
	details: ThrownDetails,
	source: ReportSource,
	frame: DashboardFrame | null,
	extra?: { componentStack?: string }
): ErrorPayload {
	const { message, name, stack } = details;
	const data = getScriptData();
	const query = redactQuery( window.location.search );

	return {
		feature: 'jetpack_stats',
		severity: 'error',
		message: sanitizeText( message, MESSAGE_LIMIT ),
		trace: stack === undefined ? undefined : sanitizeText( stack, TRACE_LIMIT ),
		url: window.location.origin + window.location.pathname,
		blog_id: data?.site?.wpcom?.blog_id,
		jetpack_version: data?.premium_analytics?.error_reporting?.version,
		properties: definedMembers( {
			source,
			route: query.p ?? '/',
			module: frame?.path,
			widget: frame?.widget,
			error_name: name,
			component_stack:
				source === 'boundary' && typeof extra?.componentStack === 'string'
					? sanitizeText( extra.componentStack, TRACE_LIMIT )
					: undefined,
			query,
		} ),
		extra: definedMembers( { line: frame?.line, column: frame?.column } ),
	} satisfies ErrorPayload;
}

/**
 * Sends one caught error to WordPress.com's JS error log, at most once per page and within a budget.
 *
 * @param error                - The thrown value.
 * @param source               - Where the error was caught.
 * @param extra                - Extra context from the caller.
 * @param extra.componentStack - The React component stack of a boundary catch.
 */
export function reportError(
	error: unknown,
	source: ReportSource,
	extra?: { componentStack?: string }
): void {
	try {
		const config = getScriptData()?.premium_analytics?.error_reporting;
		if ( ! config?.enabled ) {
			return;
		}

		const details = describeThrown( error );
		const { message, stack } = details;
		const frame = findDashboardFrame( stack, config.script_origins );
		if ( source !== 'boundary' && ! frame ) {
			return;
		}

		const key = `${ message }\n${ frame?.url ?? '' }`;
		const hour = Math.floor( Date.now() / HOUR_MS );
		if ( seen.has( key ) || ! spendBudget( hour ) ) {
			return;
		}
		seen.add( key );

		window
			.fetch( ENDPOINT, {
				method: 'POST',
				body: new URLSearchParams( {
					error: JSON.stringify( buildPayload( details, source, frame, extra ) ),
				} ),
				keepalive: true,
			} )
			.then( response => {
				if ( ! response.ok ) {
					stopForHour( hour );
				}
			} )
			.catch( () => {} );
	} catch {
		// A reporter failure must never become a second error.
	}
}
