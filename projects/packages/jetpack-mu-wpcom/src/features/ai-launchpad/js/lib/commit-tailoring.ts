import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { selectFallback } from './fallback.ts';
import {
	contextFromTailorResult,
	setTracksContext,
	trackTailoringSaveFailed,
	trackTailoringSaveOutcome,
	trackTailoringSaveRetryClicked,
} from './tracks.ts';
import type { SiteCopy, TailoredOutput, TailorResult, TailorSource, WizardInput } from './types.ts';

/**
 * A tailored output that exists only in memory: nothing has been persisted, no
 * `tailored` record has been logged, and the Tracks context still points at the
 * previous run.
 */
export interface PreparedTailoring {
	source: TailorSource;
	output: TailoredOutput;
	// The tailoring call's own duration, excluding the persist.
	durationMs: number;
	attempts: number;
	aiSessionId: string;
	// One reason per failed jetpack-ai-query attempt (paths and rule names only, never values).
	validationErrors: string[];
}

/** At most this many failure reasons are sent; the server caps them again. */
export const MAX_VALIDATION_ERRORS = 4;

/** Each failure reason is cut to this many characters; the server caps them again. */
export const MAX_VALIDATION_ERROR_LENGTH = 400;

/**
 * Persist the tailored output via Stream B's PUT /tailored. The timing/attempt
 * telemetry rides along as query params so the server's `tailored` Logstash
 * record carries it; there is no separate client-side event.
 *
 * @param output                     - The tailored output to persist.
 * @param source                     - Whether the output came from AI or the fallback.
 * @param telemetry                  - Tailoring telemetry for the server's Logstash record.
 * @param telemetry.durationMs       - How long tailoring took, in milliseconds.
 * @param telemetry.attempts         - How many jetpack-ai-query attempts were made.
 * @param telemetry.aiSessionId      - The id minted for this tailoring run.
 * @param telemetry.validationErrors - Why each failed attempt failed.
 */
async function persist(
	output: TailoredOutput,
	source: TailorSource,
	telemetry: {
		durationMs: number;
		attempts: number;
		aiSessionId: string;
		validationErrors: string[];
	}
): Promise< void > {
	const validationErrors = telemetry.validationErrors
		.slice( 0, MAX_VALIDATION_ERRORS )
		.map( reason => reason.slice( 0, MAX_VALIDATION_ERROR_LENGTH ) );
	await apiFetch( {
		path: addQueryArgs( '/wpcom/v2/ai-launchpad/tailored', {
			source,
			duration_ms: telemetry.durationMs,
			attempts: telemetry.attempts,
			ai_session_id: telemetry.aiSessionId,
			// Left off entirely when every attempt succeeded, so the record keeps its usual shape.
			...( validationErrors.length > 0 ? { validation_errors: validationErrors } : {} ),
		} ),
		method: 'PUT',
		data: output,
		// Lets the write finish when the user leaves while it is in flight, so a list that is
		// ready still gets saved. The payload is a few KB, well inside keepalive's 64 KB budget.
		keepalive: true,
	} );
}

/** The longest WP error code the save-failed event carries. */
const MAX_ERROR_CODE_LENGTH = 64;

/**
 * The waits before each automatic retry of a write that failed in transit. Two retries: a
 * dropped connection usually recovers within seconds, and every wait is time the user spends
 * looking at the loading state.
 */
export const SAVE_RETRY_DELAYS_MS = [ 1000, 3000 ] as const;

/** What apiFetch rejects with, as far as this module reads it. */
interface SaveError {
	code?: unknown;
	data?: { status?: unknown } | null;
}

/**
 * The HTTP status a failed write got, or 0 when it got no response (offline, blocked, cancelled).
 *
 * @param error - What apiFetch rejected with.
 * @return The status.
 */
function failureStatus( error: unknown ): number {
	const status = ( ( error ?? {} ) as SaveError ).data?.status;
	return typeof status === 'number' && Number.isInteger( status ) ? status : 0;
}

/**
 * Whether the server read the list and turned it down (a 4xx carrying a WP error code), as opposed
 * to the write failing in transit (no response, or a 5xx). Only a rejection says anything about the
 * list itself: re-sending it would fail the same way, while a transport failure says nothing about
 * it, so swapping in the fallback would only hide a good list.
 *
 * @param error - What apiFetch rejected with.
 * @return True for a rejection.
 */
function isRejection( error: unknown ): boolean {
	const status = failureStatus( error );
	return status >= 400 && status < 500 && typeof ( ( error ?? {} ) as SaveError ).code === 'string';
}

/**
 * Report a failed write to Tracks, with only the status and the error code: never the message, which
 * can quote the payload, and never the payload itself. Reporting must not throw, since it runs inside
 * the catch that keeps a failed write from reaching the UI.
 *
 * @param source      - Which write failed.
 * @param retry       - Which attempt at that write failed, from 0.
 * @param error       - What apiFetch rejected with: the WP error body, `{ code: 'fetch_error' }` offline, or
 *                    an Error thrown on the way (e.g. a failed nonce refresh).
 * @param aiSessionId - The id minted for this tailoring run.
 */
function reportSaveFailure(
	source: TailorSource,
	retry: number,
	error: unknown,
	aiSessionId: string
): void {
	try {
		const { code } = ( error ?? {} ) as SaveError;
		// A thrown Error carries no WP code; its name (TypeError, AbortError, ...) still tells a failed
		// nonce refresh or an aborted request apart from a rejected payload.
		let rawCode: string | null = null;
		if ( typeof code === 'string' ) {
			rawCode = code;
		} else if ( error instanceof Error ) {
			rawCode = error.name;
		}
		const errorCode =
			null !== rawCode
				? rawCode
						.toLowerCase()
						.replace( /[^a-z0-9_]/g, '' )
						.slice( 0, MAX_ERROR_CODE_LENGTH )
				: '';
		trackTailoringSaveFailed( {
			failed_write: source,
			retry,
			http_status: failureStatus( error ),
			error_code: errorCode || 'unknown',
			ai_session_id: sessionIdProp( aiSessionId ),
		} );
	} catch {
		// Telemetry only.
	}
}

/**
 * The session id as the events carry it.
 *
 * @param aiSessionId - The id minted for this tailoring run, or ''.
 * @return The id, or 'none'.
 */
function sessionIdProp( aiSessionId: string ): string {
	return '' !== aiSessionId ? aiSessionId : 'none';
}

/**
 * Run a Tracks recorder without letting it throw into the save flow.
 *
 * @param track - The recorder call.
 */
function safely( track: () => void ): void {
	try {
		track();
	} catch {
		// Telemetry only.
	}
}

/** How a write with its automatic retries ended. */
type WriteResult = 'saved' | 'rejected' | 'failed' | 'leaving';

/** Options for commitTailoring(), injectable for tests. */
export interface CommitOptions {
	/** Whether the page is on its way out; never, by default. */
	pageIsLeaving?: () => Promise< boolean >;
	/** Waits between automatic retries; setTimeout by default. */
	sleep?: ( ms: number ) => Promise< void >;
}

/**
 * Write a prepared tailoring: persist it and point the Tracks context at the run
 * that produced it. Call this once, for the one tailoring the user ends up with.
 *
 * A write that fails in transit (no response, or a 5xx) is retried with the same
 * output after each of SAVE_RETRY_DELAYS_MS. If it still fails, the result carries
 * a `saveError` whose `retry` re-sends that output, and the host shows an error in
 * place of a list that was never saved.
 *
 * Only an AI list the server rejects (a 4xx) is replaced by the fallback, which is
 * then written the same way. A rejected fallback leaves nothing to try, so it too
 * ends in the save error.
 *
 * When the page is leaving, nothing more is sent and the result is null: the next
 * visit shows the wizard again.
 *
 * @param prepared - The tailoring to write.
 * @param input    - The collected wizard input, for the fallback.
 * @param copy     - The site-language copy the fallback drafts are written from.
 * @param options  - See CommitOptions.
 * @return The tailored result, tagged with whether it came from AI or fallback; null when nothing was saved because the page was leaving.
 */
export async function commitTailoring(
	prepared: PreparedTailoring,
	input: WizardInput,
	copy: SiteCopy,
	options: CommitOptions = {}
): Promise< TailorResult | null > {
	const {
		pageIsLeaving = () => Promise.resolve( false ),
		sleep = ms => new Promise< void >( resolve => setTimeout( resolve, ms ) ),
	} = options;
	const sessionId = sessionIdProp( prepared.aiSessionId );
	// Per write, so the save-failed events of a "Try again" carry on from the automatic attempts.
	const tries: Record< TailorSource, number > = { ai: 0, fallback: 0 };

	/**
	 * Send one write once, reporting a failure.
	 *
	 * @param output - The list to write.
	 * @param source - Which list it is.
	 * @return 'saved', or the failure's kind.
	 */
	const attempt = async (
		output: TailoredOutput,
		source: TailorSource
	): Promise< Exclude< WriteResult, 'failed' > | 'transport' > => {
		const retry = tries[ source ]++;
		try {
			await persist( output, source, prepared );
			return 'saved';
		} catch ( error ) {
			if ( await pageIsLeaving() ) {
				// Leaving cancelled the write: not a failure worth reporting or acting on.
				return 'leaving';
			}
			reportSaveFailure( source, retry, error, prepared.aiSessionId );
			return isRejection( error ) ? 'rejected' : 'transport';
		}
	};

	/**
	 * Send one write, retrying a transport failure after each of SAVE_RETRY_DELAYS_MS.
	 *
	 * @param output - The list to write.
	 * @param source - Which list it is.
	 * @return How the write ended.
	 */
	const write = async ( output: TailoredOutput, source: TailorSource ): Promise< WriteResult > => {
		let result = await attempt( output, source );
		for ( const delay of SAVE_RETRY_DELAYS_MS ) {
			if ( 'transport' !== result ) {
				return result;
			}
			await sleep( delay );
			if ( await pageIsLeaving() ) {
				return 'leaving';
			}
			result = await attempt( output, source );
		}
		return 'transport' === result ? 'failed' : result;
	};

	/**
	 * The result for a list that is now saved.
	 *
	 * @param output - The saved list.
	 * @param source - Which list it is.
	 * @return The result.
	 */
	const saved = ( output: TailoredOutput, source: TailorSource ): TailorResult => {
		setTracksContext( contextFromTailorResult( source, prepared.aiSessionId ) );
		return { source, output };
	};

	/**
	 * The result for a list that could not be saved: shown as an error, with a retry that
	 * re-sends this same list once per call.
	 *
	 * @param output - The unsaved list.
	 * @param source - Which list it is.
	 * @return The result.
	 */
	const unsaved = ( output: TailoredOutput, source: TailorSource ): TailorResult => {
		safely( () =>
			trackTailoringSaveOutcome( { save_outcome: 'error_shown', ai_session_id: sessionId } )
		);
		return {
			source,
			output,
			saveError: {
				retry: async () => {
					const ok = 'saved' === ( await attempt( output, source ) );
					safely( () =>
						trackTailoringSaveRetryClicked( {
							failed_write: source,
							result: ok ? 'saved' : 'failed',
							ai_session_id: sessionId,
						} )
					);
					if ( ok ) {
						setTracksContext( contextFromTailorResult( source, prepared.aiSessionId ) );
					}
					return ok;
				},
			},
		};
	};

	if ( 'ai' === prepared.source ) {
		const result = await write( prepared.output, 'ai' );
		if ( 'leaving' === result ) {
			// Saving the fallback in place of an AI list the user left behind would make it
			// their list for good; saving nothing shows them the wizard again next time.
			return null;
		}
		if ( 'saved' === result ) {
			safely( () =>
				trackTailoringSaveOutcome( { save_outcome: 'saved', ai_session_id: sessionId } )
			);
			return saved( prepared.output, 'ai' );
		}
		if ( 'failed' === result ) {
			// The list is fine; only the connection failed. The fallback would just hide it.
			return unsaved( prepared.output, 'ai' );
		}
		// Rejected: the server turned this list down, so the fallback takes its place.
	}

	// `attempts` in the write's telemetry counts the failed AI calls that preceded the fallback.
	const fallbackOutput =
		'fallback' === prepared.source ? prepared.output : selectFallback( input, copy );
	const result = await write( fallbackOutput, 'fallback' );
	if ( 'leaving' === result ) {
		return null;
	}
	if ( 'saved' === result ) {
		safely( () =>
			trackTailoringSaveOutcome( { save_outcome: 'fallback_saved', ai_session_id: sessionId } )
		);
		return saved( fallbackOutput, 'fallback' );
	}
	return unsaved( fallbackOutput, 'fallback' );
}
