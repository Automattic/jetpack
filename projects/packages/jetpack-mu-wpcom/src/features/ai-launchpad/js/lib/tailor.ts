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
 * Call jetpack-ai-query with the combined prompt and return validated output,
 * or null on any failure (network, timeout, auth, quota, malformed or
 * schema-invalid response).
 *
 * @param input - The collected wizard input.
 * @return The validated output, or null.
 */
async function fetchAiOutput( input: WizardInput ): Promise< TailoredOutput | null > {
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
				max_tokens: 1500,
				response_format: 'json_object',
				stream: false,
			} ),
			signal: controller.signal,
		} );

		if ( ! response.ok ) {
			return null;
		}

		const body = ( await response.json() ) as AiQueryResponse;
		const content = body.choices?.[ 0 ]?.message?.content;
		if ( ! content ) {
			return null;
		}

		return parseAgentResponse( content );
	} catch {
		// Network, timeout, auth, or quota failure: fall back to the deterministic
		// picker. The AI call itself is logged server-side by the AI Proxy.
		return null;
	} finally {
		clearTimeout( timeout );
	}
}

/**
 * Persist the tailored output via Stream B's PUT /tailored. The body is the
 * unwrapped schema payload; the source is passed as a query parameter.
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
 * Tailor the launchpad from the wizard input: call jetpack-ai-query with the
 * combined prompt, validate the response against the agent output schema, and
 * fall back to the deterministic picker on any failure (network, auth, quota,
 * malformed or schema-invalid output). The result is persisted via Stream B's
 * PUT /tailored, tagged with its source. If the AI output is rejected by the
 * server (422), retry the persist with the deterministic fallback.
 *
 * @param input - The collected wizard input.
 * @return The tailored result, tagged with whether it came from AI or fallback.
 */
export async function tailor( input: WizardInput ): Promise< TailorResult > {
	const start = performance.now();
	const aiOutput = await fetchAiOutput( input );

	if ( aiOutput ) {
		try {
			await persist( aiOutput, 'ai' );
			trackAiResponseReceived( {
				duration_ms: Math.round( performance.now() - start ),
				source: 'ai',
			} );
			return { source: 'ai', output: aiOutput };
		} catch {
			// PUT rejected the AI output (e.g. 422 / per-site catalog filtering);
			// fall through to the deterministic fallback below.
		}
	}

	const fallbackOutput = selectFallback( input );
	try {
		await persist( fallbackOutput, 'fallback' );
	} catch {
		// The deterministic fallback is meant to be guaranteed. Even if the write
		// fails, still return it so the consumer renders the local list instead of
		// an empty launchpad.
	}
	trackAiResponseReceived( {
		duration_ms: Math.round( performance.now() - start ),
		source: 'fallback',
	} );
	return { source: 'fallback', output: fallbackOutput };
}
