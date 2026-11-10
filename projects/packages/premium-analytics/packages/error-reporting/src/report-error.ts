import { getScriptData } from '@automattic/jetpack-script-data';
import { isChunkLoadError, recoverFromChunkLoad } from './chunk-recovery';
import { findDashboardFrame } from './dashboard-frame';
import { detectDomInterference } from './dom-interference';
import { redactQuery, routePathname } from './redact-query';
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
const USERINFO = /^(https?:\/\/)[^/?#]*@/;

// Broader than an RFC address on purpose, but the domain must carry a dot, so a Firefox stack
// frame such as `render@https://host/x.js:1:1` is not mistaken for one and erased.
const EMAIL = /[^\s<>()[\]{}",;:@]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

interface ErrorProperties {
	source: ReportSource;
	version: string;
	route: string;
	module: string;
	widget: string;
	error_name: string;
	dom_interference: string;
	component_stack: string;
	query: string;
}

interface ErrorPayload {
	feature: 'jetpack_stats';
	severity: 'error';
	message: string;
	trace?: string;
	url: string;
	blog_id?: number;
	tags?: string[];
	properties?: Partial< ErrorProperties >;
	extra?: { line?: number; column?: number };
}

const seen = new Set< string >();
let pageCount = 0;
let stoppedHour: number | null = null;
const warnedStatuses = new Set< number >();

/**
 * Clears the dedupe set, the page counter, the stop flag and the warned statuses.
 */
export function resetErrorReporterForTests(): void {
	seen.clear();
	pageCount = 0;
	stoppedHour = null;
	warnedStatuses.clear();
}

/**
 * Pulls the fields a report needs out of anything that can be thrown.
 *
 * @param error - The thrown value.
 * @return The message, plus the name and stack when the value has them.
 */
function describeThrown( error: unknown ): ThrownDetails {
	if ( ( typeof error !== 'object' && typeof error !== 'function' ) || error === null ) {
		const text = String( error );
		return { message: text.trim() === '' ? 'Non-error thrown' : text };
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
 * Credentials go with them. The email pattern catches those of a named host by chance, and never
 * those of an IP address or `localhost`.
 *
 * @param url - An absolute http(s) URL found in free text.
 * @return The URL without its credentials, query string or hash.
 */
function redactUrl( url: string ): string {
	const clean = url.replace( USERINFO, '$1' );
	const cut = clean.search( /[?#]/ );
	if ( cut === -1 ) {
		return clean;
	}

	const position = /(?::\d+){1,2}$/.exec( clean )?.[ 0 ] ?? '';
	return `${ clean.slice( 0, cut ) }${ clean[ cut ] }[redacted]${ position }`;
}

/**
 * Removes query strings, hashes and email addresses from free text, then caps its length.
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

	// Truncation comes last, so it cannot cut a redaction in half.
	return clean.replace( ABSOLUTE_URL, redactUrl ).replace( EMAIL, '[email]' ).slice( 0, limit );
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
 * Names a refused report in the console, once per status per page load and never in production.
 *
 * Once per status rather than once per page: the first refusal would otherwise hide a later one of
 * another kind, and they call for different fixes.
 *
 * @param status - The HTTP status the endpoint answered.
 */
function warnRefused( status: number ): void {
	if ( warnedStatuses.has( status ) || process.env.NODE_ENV === 'production' ) {
		return;
	}

	warnedStatuses.add( status );
	// eslint-disable-next-line no-console -- Zero reports otherwise looks exactly like a healthy dashboard.
	console.warn( `Premium Analytics error reporting: the endpoint answered ${ status }.` );
}

/**
 * Handles the endpoint's answer: name any refusal, and stop reporting for the rest of the hour.
 *
 * Any refusal stops the hour, because a request sent while a ban is active restarts that ban.
 *
 * @param response - The endpoint's response.
 * @param hour     - The current hour bucket.
 */
function handleResponse( response: Response, hour: number ): void {
	if ( response.ok ) {
		return;
	}

	warnRefused( response.status );
	stopForHour( hour );
}

/**
 * Builds the payload for the js-error endpoint. Only top-level keys the endpoint keeps are allowed.
 *
 * @param details              - The message, name and stack of the thrown value.
 * @param message              - The sanitized message, which also keys the dedupe set.
 * @param source               - Where the error was caught.
 * @param frame                - The first dashboard frame of the stack, if any.
 * @param extra                - Extra context from the caller.
 * @param extra.componentStack - The React component stack of a boundary catch.
 * @return The payload object.
 */
function buildPayload(
	details: ThrownDetails,
	message: string,
	source: ReportSource,
	frame: DashboardFrame | null,
	extra?: { componentStack?: string }
): ErrorPayload {
	const { name, stack } = details;
	const data = getScriptData();
	const { search } = window.location;
	const chunkLoad = isChunkLoadError( details.message, name );
	const domInterference = detectDomInterference();
	// Both mark an error that is not our bug, so a search on this feature can exclude them.
	const tags = [
		...( chunkLoad ? [ 'chunk-load' ] : [] ),
		...( domInterference ? [ 'dom-interference' ] : [] ),
	];

	return {
		feature: 'jetpack_stats',
		severity: 'error',
		message,
		trace: stack === undefined ? undefined : sanitizeText( stack, TRACE_LIMIT ),
		url: window.location.origin + window.location.pathname,
		blog_id: data?.site?.wpcom?.blog_id,
		...( tags.length > 0 ? { tags } : {} ),
		properties: definedMembers( {
			source,
			// Not the top-level `jetpack_version`, which conventionally carries the plugin version.
			version: data?.premium_analytics?.error_reporting?.version,
			route: routePathname( new URLSearchParams( search ).get( 'p' ) ?? '/' ),
			module: frame?.path,
			widget: frame?.widget,
			error_name: name,
			dom_interference: domInterference,
			component_stack:
				source === 'boundary' && typeof extra?.componentStack === 'string'
					? sanitizeText( extra.componentStack, TRACE_LIMIT )
					: undefined,
			query: redactQuery( search ),
		} ),
		extra: definedMembers( { line: frame?.line, column: frame?.column } ),
	} satisfies ErrorPayload;
}

/**
 * Posts one report, unless it duplicates one already sent or the budget is spent.
 *
 * @param details              - The message, name and stack of the thrown value.
 * @param source               - Where the error was caught.
 * @param frame                - The first dashboard frame of the stack, if any.
 * @param extra                - Extra context from the caller.
 * @param extra.componentStack - The React component stack of a boundary catch.
 */
function send(
	details: ThrownDetails,
	source: ReportSource,
	frame: DashboardFrame | null,
	extra?: { componentStack?: string }
): void {
	// The raw message can embed the page query string, which changes on every date-range change.
	const message = sanitizeText( details.message, MESSAGE_LIMIT );
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
				error: JSON.stringify( buildPayload( details, message, source, frame, extra ) ),
			} ),
			keepalive: true,
			credentials: 'omit',
		} )
		.then( response => handleResponse( response, hour ) )
		.catch( () => {} );
}

/**
 * Sends one caught error to WordPress.com's JS error log, at most once per page and within a budget.
 *
 * A failed module load also reloads the page. The report goes first, and `keepalive` carries it
 * through the navigation.
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
		const frame = findDashboardFrame( details.stack, config.script_origins );
		if ( source !== 'boundary' && ! frame ) {
			return;
		}

		send( details, source, frame, extra );

		// Outside `send`, so a report the dedupe or the budget dropped still leaves a working page.
		if ( isChunkLoadError( details.message, details.name ) ) {
			recoverFromChunkLoad();
		}
	} catch {
		// A reporter failure must never become a second error.
	}
}
