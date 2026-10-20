import { getScriptData } from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import { debugQueryArgs, logQueryArgs } from './log-query';
import { periodArgs } from './period';
import type {
	CloudflareApplyResult,
	DebugEntry,
	DebugPage,
	DebugQuery,
	DnsHost,
	DnsLookup,
	LogDeleteResult,
	LogEntry,
	LogOrigin,
	LogPage,
	LogQuery,
	LogSummary,
	OnboardingUpdate,
	Period,
	ResendRequest,
	ResendResult,
	SendStatus,
	Stats,
	TestResult,
	Usage,
} from './types';

export const STATUS_PATH = '/jetpack-send/v1/status';

export type SendAction = 'setup' | 'check-dns' | 'settings' | 'reset';

type SendScriptData = { send?: { preload?: Record< string, unknown > } };

// Every route bundles this module; the first consumes the preload so later routes can't replay stale data.
const scriptData = getScriptData() as unknown as SendScriptData | undefined;
if ( scriptData?.send?.preload ) {
	apiFetch.use( apiFetch.createPreloadingMiddleware( scriptData.send.preload ) );
	delete scriptData.send.preload;
}

export const fetchStatus = () => apiFetch< SendStatus >( { path: STATUS_PATH } );

export const postAction = ( action: SendAction, data?: Record< string, unknown > ) =>
	apiFetch< SendStatus >( { path: `/jetpack-send/v1/${ action }`, method: 'POST', data } );

/**
 * Send a test to the current user's own email. The server picks the recipient.
 *
 * @return The result.
 */
export const sendTest = () =>
	apiFetch< TestResult >( { path: '/jetpack-send/v1/test', method: 'POST' } );

/**
 * Save onboarding progress. Resolves with the new status; pass it to the store's `receiveStatus`.
 *
 * @param update - Client-writable onboarding fields.
 * @return The updated status.
 */
export const saveOnboarding = ( update: OnboardingUpdate ) =>
	apiFetch< SendStatus >( {
		path: '/jetpack-send/v1/settings',
		method: 'POST',
		data: { onboarding: update },
	} );

/**
 * Who runs the domain's DNS. Cached on the server; `refresh` runs detection again.
 *
 * @param refresh - Ignore the cached result.
 * @return The detection result.
 */
export const fetchDnsHost = ( refresh = false ) =>
	apiFetch< DnsHost >( {
		path: addQueryArgs( '/jetpack-send/v1/dns-host', refresh ? { refresh: 1 } : {} ),
	} );

/**
 * A local look at the domain's records. Free, so it can be polled.
 *
 * @return Each record's state.
 */
export const fetchDnsLookup = () =>
	apiFetch< DnsLookup >( { path: '/jetpack-send/v1/dns-lookup' } );

/**
 * Write the records at Cloudflare with a scoped API token. The server uses the token once and
 * never stores it.
 *
 * @param token - Cloudflare API token with DNS edit rights on one zone.
 * @return What was written, plus the new status.
 */
export const applyCloudflare = ( token: string ) =>
	apiFetch< CloudflareApplyResult >( {
		path: '/jetpack-send/v1/cloudflare/apply',
		method: 'POST',
		data: { token },
	} );

/**
 * Ask for a signed link to the provider's approval page. Only offered when GET /dns-host says
 * one-click is supported; no server route answers yet.
 *
 * @return The link.
 */
export const postDomainConnect = () =>
	apiFetch< { url: string } >( { path: '/jetpack-send/v1/domain-connect', method: 'POST' } );

/**
 * Ask the server to add both records on a domain managed at WordPress.com. Only offered when
 * GET /dns-host says it can; no server route answers yet.
 *
 * @return The new status.
 */
export const postWpcomDns = () =>
	apiFetch< SendStatus >( { path: '/jetpack-send/v1/wpcom-dns', method: 'POST' } );

export const fetchUsage = () => apiFetch< Usage >( { path: '/jetpack-send/v1/usage' } );

/**
 * Email activity for a period, from the counts table.
 *
 * @param period - A preset or custom days.
 * @return The stats.
 */
export const fetchStats = ( period: Period ) =>
	apiFetch< Stats >( { path: addQueryArgs( '/jetpack-send/v1/stats', periodArgs( period ) ) } );

/**
 * One page of the Log.
 *
 * @param query          - Page, search, filters and period.
 * @param options        - Options.
 * @param options.signal - Aborts the request, so a stale search never lands.
 * @return The page.
 */
export const fetchLog = ( query: LogQuery, { signal }: { signal?: AbortSignal } = {} ) =>
	apiFetch< LogPage >( {
		path: addQueryArgs( '/jetpack-send/v1/log', logQueryArgs( query ) ),
		signal,
	} );

export const fetchLogEntry = ( id: string ) =>
	apiFetch< LogEntry >( { path: `/jetpack-send/v1/log/${ encodeURIComponent( id ) }` } );

/**
 * The origins still in the log, most first.
 *
 * @return The origins.
 */
export const fetchLogOrigins = () =>
	apiFetch< LogOrigin[] >( { path: '/jetpack-send/v1/log/origins' } );

// Its own module, so the store's `logChanged()` can drop the cache wherever this one is mocked.
export { forgetOriginOptions, getOriginOptions } from './origin-options';

/**
 * Send a logged email again, straight to the service. Refusals reject with the REST error.
 *
 * @param id      - The original's log id.
 * @param request - Who it goes to.
 * @return The new copy's result.
 */
export const resendLogEntry = ( id: string, request: ResendRequest ) =>
	apiFetch< ResendResult >( {
		path: `/jetpack-send/v1/log/${ encodeURIComponent( id ) }/resend`,
		method: 'POST',
		data: request,
	} );

/**
 * How many emails the log holds and how many each shorter retention would delete.
 *
 * @return The summary.
 */
export const fetchLogSummary = () =>
	apiFetch< LogSummary >( { path: '/jetpack-send/v1/log/summary' } );

/**
 * One page of the debug log, newest first.
 *
 * @param query - Page, search and filters.
 * @return The page.
 */
export const fetchDebugLog = ( query: DebugQuery ) =>
	apiFetch< DebugPage >( {
		path: addQueryArgs( '/jetpack-send/v1/debug-log', debugQueryArgs( query ) ),
	} );

export const fetchDebugEntry = ( id: string ) =>
	apiFetch< DebugEntry >( {
		path: `/jetpack-send/v1/debug-log/${ encodeURIComponent( id ) }`,
	} );

/**
 * The newest 200 matching entries as plain text, for "Copy for support".
 *
 * @param query          - Search and filters.
 * @param options        - Options.
 * @param options.signal - Aborts the request when the filters change again.
 * @return The text and how many entries it holds.
 */
export const fetchDebugText = (
	query: Omit< DebugQuery, 'page' | 'per_page' >,
	{ signal }: { signal?: AbortSignal } = {}
) =>
	apiFetch< { text: string; count: number } >( {
		path: addQueryArgs( '/jetpack-send/v1/debug-log/text', debugQueryArgs( query ) ),
		signal,
	} );

/**
 * Delete every debug log entry.
 *
 * @return How many were deleted.
 */
export const clearDebugLog = () =>
	apiFetch< { deleted: number } >( { path: '/jetpack-send/v1/debug-log/clear', method: 'POST' } );

/**
 * Delete emails from the log for good: one row or a page of them, in one request.
 *
 * @param ids - Log row ids, at most 100.
 * @return The ids removed and the ones already gone.
 */
export const deleteLogEntries = ( ids: string[] ) =>
	apiFetch< LogDeleteResult >( {
		path: '/jetpack-send/v1/log/delete',
		method: 'POST',
		data: { ids: ids.map( Number ) },
	} );

const MAX_MESSAGE_LENGTH = 2000;

const NAMED_ENTITIES: Record< string, string > = {
	amp: '&',
	lt: '<',
	gt: '>',
	quot: '"',
	apos: "'",
	nbsp: ' ',
	hellip: '…',
	lsquo: '‘',
	rsquo: '’',
	ldquo: '“',
	rdquo: '”',
	ndash: '–',
	mdash: '—',
};

/**
 * A message as plain text, without parsing it as HTML. WordPress's fatal error handler sends HTML
 * with a link; the link's words mean nothing without it, so they go too.
 *
 * @param message - The message, maybe HTML.
 * @return Plain text.
 */
function plainText( message: string ): string {
	// Capped first: the tag patterns rescan from every "<", so long input gets slow.
	// A tag name ends at a space, "/" or ">", so an address like <jo@example.com> stays.
	return message
		.slice( 0, MAX_MESSAGE_LENGTH )
		.replace( /<!--[\s\S]*?(?:-->|$)/g, ' ' )
		.replace( /<a\b[^>]*>[\s\S]*?<\/a>/gi, ' ' )
		.replace( /<\/?[a-z][a-z0-9-]*(?:[\s/][^<>]*)?(?:>|$)/gi, ' ' )
		.replace( /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, ( entity, name: string ) => {
			if ( name[ 0 ] !== '#' ) {
				return NAMED_ENTITIES[ name.toLowerCase() ] ?? entity;
			}
			const code =
				name[ 1 ] === 'x' || name[ 1 ] === 'X'
					? parseInt( name.slice( 2 ), 16 )
					: Number( name.slice( 1 ) );
			return code > 0 && code <= 0x10ffff ? String.fromCodePoint( code ) : entity;
		} )
		.replace( /\s+/g, ' ' )
		.trim();
}

/**
 * A readable message from an apiFetch rejection, always plain text.
 *
 * @param error - The rejection.
 * @return The message.
 */
export function errorMessage( error: unknown ): string {
	if (
		error &&
		typeof error === 'object' &&
		'message' in error &&
		typeof error.message === 'string'
	) {
		const message = plainText( error.message );
		if ( message ) {
			return message;
		}
	}
	return __( 'Something went wrong. Please try again.', 'jetpack-send-pkg' );
}
