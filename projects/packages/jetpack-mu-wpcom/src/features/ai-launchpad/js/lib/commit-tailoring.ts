import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { selectFallback } from './fallback.ts';
import { contextFromTailorResult, setTracksContext } from './tracks.ts';
import type { SiteCopy, TailoredOutput, TailorResult, TailorSource, WizardInput } from './types.ts';

/**
 * A tailored output that exists only in memory: nothing has been persisted, no
 * `tailored` record has been logged, and the Tracks context still points at the
 * previous run. Prewarming stops here.
 */
export interface PreparedTailoring {
	source: TailorSource;
	output: TailoredOutput;
	// The tailoring call's own duration, so a prewarmed run doesn't also count the
	// time the user then spent in the wizard.
	durationMs: number;
	attempts: number;
	aiSessionId: string;
}

/**
 * Persist the tailored output via Stream B's PUT /tailored. The timing/attempt
 * telemetry rides along as query params so the server's `tailored` Logstash
 * record carries it; there is no separate client-side event.
 *
 * @param output                - The tailored output to persist.
 * @param source                - Whether the output came from AI or the fallback.
 * @param telemetry             - Tailoring telemetry for the server's Logstash record.
 * @param telemetry.durationMs  - How long tailoring took, in milliseconds.
 * @param telemetry.attempts    - How many jetpack-ai-query attempts were made.
 * @param telemetry.aiSessionId - The id minted for this tailoring run.
 */
async function persist(
	output: TailoredOutput,
	source: TailorSource,
	telemetry: { durationMs: number; attempts: number; aiSessionId: string }
): Promise< void > {
	await apiFetch( {
		path: addQueryArgs( '/wpcom/v2/ai-launchpad/tailored', {
			source,
			duration_ms: telemetry.durationMs,
			attempts: telemetry.attempts,
			ai_session_id: telemetry.aiSessionId,
		} ),
		method: 'PUT',
		data: output,
	} );
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
		} catch {
			// PUT rejected the AI output; fall through to the deterministic fallback below.
		}
	}

	const fallbackOutput =
		'fallback' === prepared.source ? prepared.output : selectFallback( input, copy );
	try {
		// `attempts` counts the failed AI calls that preceded the fallback.
		await persist( fallbackOutput, 'fallback', prepared );
	} catch {
		// Even if the write fails, still return the fallback so the consumer renders a list, not an empty launchpad.
	}
	setTracksContext( contextFromTailorResult( 'fallback', prepared.aiSessionId ) );
	return { source: 'fallback', output: fallbackOutput };
}
