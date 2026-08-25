import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { selectFallback } from './fallback.ts';
import { requestJwt } from './jwt.ts';
import { buildTailorPrompt, chooseTailoringMenu } from './prompts.ts';
import { parseAgentResponse } from './schema-validator.ts';
import { contextFromTailorResult, setTracksContext } from './tracks.ts';
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
 * Mints a session id for a tailoring run, or '' when `crypto.randomUUID` isn't available.
 *
 * `crypto.randomUUID` is undefined outside a secure context and on older Safari/Firefox, and
 * throws rather than returning undefined — unguarded, that would reject `tailor()` before any
 * tailoring happens, and every caller catches, so the user would see an empty launchpad instead
 * of a list. This purely analytical id must not be able to break list rendering; the server
 * already treats an empty `ai_session_id` as absent.
 *
 * @return A UUID, or '' when unavailable.
 */
function mintAiSessionId(): string {
	try {
		return crypto.randomUUID();
	} catch {
		return '';
	}
}

/**
 * Call jetpack-ai-query once with the combined prompt and return the validated
 * output, or a failure outcome tagging whether the failure is worth retrying.
 *
 * @param input            - The collected wizard input.
 * @param availableTaskIds - Task ids the prompt may offer (filters the menu).
 * @return The attempt outcome.
 */
async function fetchAiOutput(
	input: WizardInput,
	availableTaskIds: readonly string[]
): Promise< FetchOutcome > {
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
				messages: [ { role: 'user', content: buildTailorPrompt( input, availableTaskIds ) } ],
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
 * return the validated output (or null) plus how many attempts were made.
 *
 * @param input            - The collected wizard input.
 * @param availableTaskIds - Task ids the prompt may offer (filters the menu).
 * @return The validated output (or null) and the attempt count.
 */
async function fetchAiOutputWithRetry(
	input: WizardInput,
	availableTaskIds: readonly string[]
): Promise< { output: TailoredOutput | null; attempts: number } > {
	let attempts = 1;
	let outcome = await fetchAiOutput( input, availableTaskIds );
	if ( ! outcome.ok && outcome.retryable ) {
		attempts = 2;
		outcome = await fetchAiOutput( input, availableTaskIds );
	}
	return { output: outcome.ok ? outcome.output : null, attempts };
}

/**
 * Fetch the task ids the prompt's menu may offer for this goal: the actionable ids, relaxed to all renderable
 * ids when completion leaves too few to fill a valid list (see chooseTailoringMenu). Returns an empty list on
 * failure, which leaves the prompt using the full menu.
 *
 * @param goal - The selected goal.
 * @return The task ids to offer, or an empty array.
 */
async function fetchAvailableTaskIds( goal: string ): Promise< readonly string[] > {
	try {
		const response = ( await apiFetch( {
			path: addQueryArgs( '/wpcom/v2/ai-launchpad/available-tasks', { goal } ),
		} ) ) as { available_task_ids?: string[]; renderable_task_ids?: string[] };
		const actionable = Array.isArray( response.available_task_ids )
			? response.available_task_ids
			: [];
		const renderable = Array.isArray( response.renderable_task_ids )
			? response.renderable_task_ids
			: [];
		return chooseTailoringMenu( actionable, renderable );
	} catch {
		return [];
	}
}

/**
 * Persist the tailored output via Stream B's PUT /tailored. The timing/attempt
 * telemetry rides along as query params so the server's `tailored` Logstash
 * record carries it; there is no separate client-side event.
 *
 * @param output                - The tailored output to persist.
 * @param source                - Whether the output came from AI or the fallback.
 * @param telemetry             - Tailoring telemetry for the server's Logstash record.
 * @param telemetry.durationMs  - How long tailoring took so far, in milliseconds.
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
 * Tailor the launchpad from the wizard input, falling back to the deterministic
 * picker on any failure and persisting the result tagged with its source.
 *
 * @param input - The collected wizard input.
 * @return The tailored result, tagged with whether it came from AI or fallback.
 */
export async function tailor( input: WizardInput ): Promise< TailorResult > {
	const start = performance.now();
	// One id per tailoring run, not per attempt: a retry re-rolls the same checklist. Minted
	// here rather than server-side so it survives a failed PUT, where the client still renders
	// a list and still fires events against it.
	const aiSessionId = mintAiSessionId();
	const availableTaskIds = await fetchAvailableTaskIds( input.goal );
	const { output: aiOutput, attempts } = await fetchAiOutputWithRetry( input, availableTaskIds );

	if ( aiOutput ) {
		try {
			await persist( aiOutput, 'ai', {
				durationMs: Math.round( performance.now() - start ),
				attempts,
				aiSessionId,
			} );
			setTracksContext( contextFromTailorResult( 'ai', aiSessionId ) );
			return { source: 'ai', output: aiOutput };
		} catch {
			// PUT rejected the AI output; fall through to the deterministic fallback below.
		}
	}

	const fallbackOutput = selectFallback( input );
	try {
		// `attempts` counts the failed AI calls that preceded the fallback.
		await persist( fallbackOutput, 'fallback', {
			durationMs: Math.round( performance.now() - start ),
			attempts,
			aiSessionId,
		} );
	} catch {
		// Even if the write fails, still return the fallback so the consumer renders a list, not an empty launchpad.
	}
	setTracksContext( contextFromTailorResult( 'fallback', aiSessionId ) );
	return { source: 'fallback', output: fallbackOutput };
}
