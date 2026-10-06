import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { selectFallback } from './fallback.ts';
import { contextFromTailorResult, setTracksContext, trackTailoringSaveFailed } from './tracks.ts';
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
	} );
}

/** The longest WP error code the save-failed event carries. */
const MAX_ERROR_CODE_LENGTH = 64;

/**
 * Report a failed write to Tracks, with only the status and the error code: never the message, which
 * can quote the payload, and never the payload itself. Reporting must not throw, since it runs inside
 * the catch that keeps a failed write from reaching the UI.
 *
 * @param source      - Which write failed.
 * @param error       - What apiFetch rejected with: the WP error body, `{ code: 'fetch_error' }` offline, or
 *                    an Error thrown on the way (e.g. a failed nonce refresh).
 * @param aiSessionId - The id minted for this tailoring run.
 */
function reportSaveFailure( source: TailorSource, error: unknown, aiSessionId: string ): void {
	try {
		const { code, data } = ( error ?? {} ) as {
			code?: unknown;
			data?: { status?: unknown } | null;
		};
		const status = data?.status;
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
			http_status: typeof status === 'number' && Number.isInteger( status ) ? status : 0,
			error_code: errorCode || 'unknown',
			ai_session_id: '' !== aiSessionId ? aiSessionId : 'none',
		} );
	} catch {
		// Telemetry only.
	}
}

/**
 * Write a prepared tailoring: persist it and point the Tracks context at the run
 * that produced it. Call this once, for the one tailoring the user ends up with.
 *
 * @param prepared - The tailoring to write.
 * @param input    - The collected wizard input, for the fallback.
 * @param copy     - The site-language copy the fallback drafts are written from.
 * @return The tailored result, tagged with whether it came from AI or fallback.
 */
export async function commitTailoring(
	prepared: PreparedTailoring,
	input: WizardInput,
	copy: SiteCopy
): Promise< TailorResult > {
	if ( 'ai' === prepared.source ) {
		try {
			await persist( prepared.output, 'ai', prepared );
			setTracksContext( contextFromTailorResult( 'ai', prepared.aiSessionId ) );
			return { source: 'ai', output: prepared.output };
		} catch ( error ) {
			// PUT rejected the AI output; fall through to the deterministic fallback below.
			reportSaveFailure( 'ai', error, prepared.aiSessionId );
		}
	}

	const fallbackOutput =
		'fallback' === prepared.source ? prepared.output : selectFallback( input, copy );
	try {
		// `attempts` counts the failed AI calls that preceded the fallback.
		await persist( fallbackOutput, 'fallback', prepared );
	} catch ( error ) {
		// Even if the write fails, still return the fallback so the consumer renders a list, not an empty launchpad.
		reportSaveFailure( 'fallback', error, prepared.aiSessionId );
	}
	setTracksContext( contextFromTailorResult( 'fallback', prepared.aiSessionId ) );
	return { source: 'fallback', output: fallbackOutput };
}
