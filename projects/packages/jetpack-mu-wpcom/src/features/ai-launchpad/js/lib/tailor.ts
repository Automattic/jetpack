import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { selectFallback } from './fallback.ts';
import { requestJwt } from './jwt.ts';
import { buildTailorPrompt } from './prompts.ts';
import { parseAgentResponse } from './schema-validator.ts';
import { trackAiResponseReceived } from './tracks.ts';
import type { TailoredOutput, TailorResult, TailorSource, WizardInput } from './types.ts';

const AI_QUERY_ENDPOINT = 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query';
const AI_QUERY_TIMEOUT_MS = 40_000;

interface AiQueryResponse {
	choices?: Array< { message?: { content?: string } } >;
}

/**
 * Outcome of a single jetpack-ai-query attempt; `retryable` flags transient
 * failures worth a second attempt.
 */
type FetchOutcome = { ok: true; output: TailoredOutput } | { ok: false; retryable: boolean };

/**
 * Call jetpack-ai-query once with the combined prompt and return the validated
 * output, or a failure outcome tagging whether the failure is worth retrying.
 *
 * @param input - The collected wizard input.
 * @return The attempt outcome.
 */
async function fetchAiOutput( input: WizardInput ): Promise< FetchOutcome > {
	const controller = new AbortController();
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- the timeout must arm before the awaited request and is cleared in finally.
	const timeout = setTimeout( () => controller.abort(), AI_QUERY_TIMEOUT_MS );

	try {
		const { token } = await requestJwt();
		const response = await fetch( AI_QUERY_ENDPOINT, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ' + token,
			},
			body: JSON.stringify( {
				messages: [ { role: 'user', content: buildTailorPrompt( input ) } ],
				feature: 'ai-launchpad',
				model: 'gpt-4o',
				max_tokens: 1800,
				response_format: 'json_object',
				stream: false,
			} ),
			signal: controller.signal,
		} );

		if ( ! response.ok ) {
			// 5xx and 429 are transient; 4xx (auth/quota) will not change on retry.
			return { ok: false, retryable: response.status === 429 || response.status >= 500 };
		}

		const body = ( await response.json() ) as AiQueryResponse;
		const content = body.choices?.[ 0 ]?.message?.content;
		if ( ! content ) {
			return { ok: false, retryable: true };
		}

		const output = parseAgentResponse( content );
		if ( ! output ) {
			// Malformed or schema-invalid JSON: a re-roll often returns valid output.
			return { ok: false, retryable: true };
		}

		return { ok: true, output };
	} catch {
		// Network error or timeout: not retried, since a retry only doubles the wait before the fallback.
		return { ok: false, retryable: false };
	} finally {
		clearTimeout( timeout );
	}
}

/**
 * Call jetpack-ai-query, retrying once on a transient/validation failure, and
 * return the validated output or null.
 *
 * @param input - The collected wizard input.
 * @return The validated output, or null.
 */
async function fetchAiOutputWithRetry( input: WizardInput ): Promise< TailoredOutput | null > {
	let outcome = await fetchAiOutput( input );
	if ( ! outcome.ok && outcome.retryable ) {
		outcome = await fetchAiOutput( input );
	}
	return outcome.ok ? outcome.output : null;
}

/**
 * Persist the tailored output via Stream B's PUT /tailored.
 *
 * @param output - The tailored output to persist.
 * @param source - Whether the output came from AI or the fallback.
 */
async function persist( output: TailoredOutput, source: TailorSource ): Promise< void > {
	await apiFetch( {
		path: addQueryArgs( '/wpcom/v2/ai-launchpad/tailored', { source } ),
		method: 'PUT',
		data: output,
	} );
}

/**
 * Tailor the launchpad from the wizard input, falling back to the deterministic
 * picker on any failure and persisting the result tagged with its source.
 *
 * @param input - The collected wizard input.
 * @return The tailored result, tagged with whether it came from AI or fallback.
 */
export async function tailor( input: WizardInput ): Promise< TailorResult > {
	const start = performance.now();
	const aiOutput = await fetchAiOutputWithRetry( input );

	if ( aiOutput ) {
		try {
			await persist( aiOutput, 'ai' );
			trackAiResponseReceived( {
				duration_ms: Math.round( performance.now() - start ),
				source: 'ai',
			} );
			return { source: 'ai', output: aiOutput };
		} catch {
			// PUT rejected the AI output; fall through to the deterministic fallback below.
		}
	}

	const fallbackOutput = selectFallback( input );
	try {
		await persist( fallbackOutput, 'fallback' );
	} catch {
		// Even if the write fails, still return the fallback so the consumer renders a list, not an empty launchpad.
	}
	trackAiResponseReceived( {
		duration_ms: Math.round( performance.now() - start ),
		source: 'fallback',
	} );
	return { source: 'fallback', output: fallbackOutput };
}
