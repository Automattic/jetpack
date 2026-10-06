import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { commitTailoring, type PreparedTailoring } from './commit-tailoring.ts';
import { selectFallback } from './fallback.ts';
import { requestJwt } from './jwt.ts';
import { buildTailorPrompt, chooseTailoringMenu } from './prompts.ts';
import { parseAgentResponse } from './schema-validator.ts';
import { watchTailoring } from './tailoring-watch.ts';
import type { SiteCopy, TailoredOutput, TailorResult, WizardInput } from './types.ts';

const AI_QUERY_ENDPOINT = 'https://public-api.wordpress.com/wpcom/v2/jetpack-ai-query';
const AI_QUERY_TIMEOUT_MS = 40_000;

interface AiQueryResponse {
	choices?: Array< { message?: { content?: string } } >;
}

/**
 * Outcome of a single jetpack-ai-query attempt; `retryable` flags transient
 * failures worth a second attempt, and `reason` says why the attempt failed, for
 * the `tailored` Logstash record. A reason never carries any of the reply's text.
 */
type FetchOutcome =
	{ ok: true; output: TailoredOutput } | { ok: false; retryable: boolean; reason: string };

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
				model: 'gpt-6-luna',
				max_tokens: 6000,
				response_format: 'json_object',
				stream: false,
			} ),
			signal: controller.signal,
		} );

		if ( ! response.ok ) {
			// 5xx and 429 are transient; 4xx (auth/quota) will not change on retry.
			return {
				ok: false,
				retryable: response.status === 429 || response.status >= 500,
				reason: `http: ${ response.status }`,
			};
		}

		const body = ( await response.json() ) as AiQueryResponse;
		const content = body.choices?.[ 0 ]?.message?.content;
		if ( ! content ) {
			return { ok: false, retryable: true, reason: 'content: empty' };
		}

		const { output, errors } = parseAgentResponse( content );
		if ( ! output ) {
			// Malformed or schema-invalid JSON: a re-roll often returns valid output.
			return { ok: false, retryable: true, reason: errors.join( '; ' ) };
		}

		return { ok: true, output };
	} catch {
		// Network error or timeout: not retried, since a retry only doubles the wait before the fallback.
		return {
			ok: false,
			retryable: false,
			reason: controller.signal.aborted ? 'request: timed out' : 'request: failed',
		};
	} finally {
		clearTimeout( timeout );
	}
}

/**
 * Call jetpack-ai-query, retrying once on a transient/validation failure, and
 * return the validated output (or null), how many attempts were made, and why
 * each failed attempt failed.
 *
 * @param input            - The collected wizard input.
 * @param availableTaskIds - Task ids the prompt may offer (filters the menu).
 * @return The validated output (or null), the attempt count, and one reason per failed attempt.
 */
async function fetchAiOutputWithRetry(
	input: WizardInput,
	availableTaskIds: readonly string[]
): Promise< { output: TailoredOutput | null; attempts: number; failures: string[] } > {
	const failures: string[] = [];
	let attempts = 1;
	let outcome = await fetchAiOutput( input, availableTaskIds );
	if ( ! outcome.ok ) {
		failures.push( outcome.reason );
	}
	if ( ! outcome.ok && outcome.retryable ) {
		attempts = 2;
		outcome = await fetchAiOutput( input, availableTaskIds );
		if ( ! outcome.ok ) {
			failures.push( outcome.reason );
		}
	}
	return { output: outcome.ok ? outcome.output : null, attempts, failures };
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
 * Produce a tailored output for the wizard input without writing it anywhere:
 * the AI call, or the deterministic fallback when it fails or returns nothing
 * usable.
 *
 * @param input       - The collected wizard input.
 * @param copy        - The site-language copy the fallback drafts are written from.
 * @param aiSessionId - The id for this tailoring run; minted here when the caller has none.
 * @return The prepared tailoring, awaiting a commit.
 */
export async function prepareTailoring(
	input: WizardInput,
	copy: SiteCopy,
	aiSessionId: string = mintAiSessionId()
): Promise< PreparedTailoring > {
	const start = performance.now();
	const availableTaskIds = await fetchAvailableTaskIds( input.goal );
	const { output, attempts, failures } = await fetchAiOutputWithRetry( input, availableTaskIds );

	return {
		source: output ? 'ai' : 'fallback',
		output: output ?? selectFallback( input, copy ),
		durationMs: Math.round( performance.now() - start ),
		attempts,
		aiSessionId,
		validationErrors: failures,
	};
}

/**
 * Tailor the launchpad from the wizard input and write the result, falling back
 * to the deterministic picker on any failure.
 *
 * @param input - The collected wizard input.
 * @param copy  - The site-language copy the fallback drafts are written from.
 * @return The tailored result, tagged with whether it came from AI or fallback.
 */
export async function tailor( input: WizardInput, copy: SiteCopy ): Promise< TailorResult > {
	// One id per tailoring run, not per attempt: a retry re-rolls the same checklist. Minted
	// here rather than server-side so it survives a failed PUT, where the client still renders
	// a list and still fires events against it, and so a run abandoned mid-call can name it.
	const aiSessionId = mintAiSessionId();
	const watch = watchTailoring( aiSessionId );
	try {
		const prepared = await prepareTailoring( input, copy, aiSessionId );
		watch.setStage( 'saving' );
		return await commitTailoring( prepared, input, copy );
	} finally {
		watch.settle();
	}
}
