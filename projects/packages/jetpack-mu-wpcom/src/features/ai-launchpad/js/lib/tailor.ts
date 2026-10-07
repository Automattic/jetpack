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
		let token: string;
		try {
			( { token } = await requestJwt() );
		} catch {
			// Usually a transient failure of the token endpoint; when it is a missing nonce or site
			// id instead, the retry fails just as fast, before any AI call is made.
			return { ok: false, retryable: true, reason: 'jwt: failed' };
		}
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
		// A network failure gets the one retry, like a 5xx: a blip shouldn't cost the user their
		// tailored list. Our own timeout does not, since a retry would double a wait that is already
		// AI_QUERY_TIMEOUT_MS long before the fallback. A failure caused by the page leaving is caught
		// by the caller before it can be retried.
		const timedOut = controller.signal.aborted;
		return {
			ok: false,
			retryable: ! timedOut,
			reason: timedOut ? 'request: timed out' : 'request: failed',
		};
	} finally {
		clearTimeout( timeout );
	}
}

/** Resolves true when the page is on its way out; see TailoringWatch.pageIsLeaving. */
type PageIsLeaving = () => Promise< boolean >;

/**
 * Never leaving: for callers that don't watch the page.
 *
 * @return Always false.
 */
const notLeaving: PageIsLeaving = () => Promise.resolve( false );

/**
 * Call jetpack-ai-query, retrying once on a transient/validation failure, and
 * return the validated output (or null), how many attempts were made, and why
 * each failed attempt failed.
 *
 * A failed attempt while the page is leaving is neither retried nor reported as a
 * failure: leaving cancels the request, and the run is `abandoned` instead.
 *
 * @param input            - The collected wizard input.
 * @param availableTaskIds - Task ids the prompt may offer (filters the menu).
 * @param pageIsLeaving    - Whether the page is on its way out.
 * @return The validated output (or null), the attempt count, one reason per failed attempt, and whether the run was abandoned.
 */
async function fetchAiOutputWithRetry(
	input: WizardInput,
	availableTaskIds: readonly string[],
	pageIsLeaving: PageIsLeaving
): Promise< {
	output: TailoredOutput | null;
	attempts: number;
	failures: string[];
	abandoned: boolean;
} > {
	const failures: string[] = [];
	let attempts = 1;
	let outcome = await fetchAiOutput( input, availableTaskIds );
	while ( ! outcome.ok ) {
		if ( await pageIsLeaving() ) {
			return { output: null, attempts, failures, abandoned: true };
		}
		failures.push( outcome.reason );
		if ( ! outcome.retryable || attempts >= 2 ) {
			break;
		}
		attempts = 2;
		outcome = await fetchAiOutput( input, availableTaskIds );
	}
	return { output: outcome.ok ? outcome.output : null, attempts, failures, abandoned: false };
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
 * @param input         - The collected wizard input.
 * @param copy          - The site-language copy the fallback drafts are written from.
 * @param aiSessionId   - The id for this tailoring run; minted here when the caller has none.
 * @param pageIsLeaving - Whether the page is on its way out; never, when the caller doesn't watch.
 * @return The prepared tailoring awaiting a commit, or null when the page left before the AI answered.
 */
export async function prepareTailoring(
	input: WizardInput,
	copy: SiteCopy,
	aiSessionId: string = mintAiSessionId(),
	pageIsLeaving: PageIsLeaving = notLeaving
): Promise< PreparedTailoring | null > {
	// eslint-disable-next-line @wordpress/no-unused-vars-before-return -- the clock must start before the awaited calls it times.
	const start = performance.now();
	const availableTaskIds = await fetchAvailableTaskIds( input.goal );
	const { output, attempts, failures, abandoned } = await fetchAiOutputWithRetry(
		input,
		availableTaskIds,
		pageIsLeaving
	);
	if ( abandoned ) {
		// Not the fallback: saved now, it would stand in for the user's tailored list for good.
		return null;
	}

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
 * to the deterministic picker when the AI can't produce a usable list.
 *
 * When the user leaves mid-run, the AI's list is still saved if it is ready in
 * time; otherwise nothing is, so the next visit shows the wizard again rather than
 * a fallback list the user never waited for. The returned promise then never
 * settles, since the page it would update is going away.
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
	let abandoned = false;
	try {
		const prepared = await prepareTailoring( input, copy, aiSessionId, watch.pageIsLeaving );
		if ( prepared ) {
			watch.setStage( 'saving' );
			const result = await commitTailoring( prepared, input, copy, watch.pageIsLeaving );
			if ( result ) {
				return result;
			}
		}
		abandoned = true;
	} finally {
		if ( abandoned ) {
			watch.abandon();
		} else {
			watch.settle();
		}
	}
	return new Promise< never >( () => {} );
}
