import { CriticalCssErrorDetailsSchema, CriticalCssStateSchema } from './critical-css-state-types';
import type { CriticalCssState, Provider } from './critical-css-state-types';
import {
	queryClient,
	useDataSync,
	useDataSyncAction,
} from '@automattic/jetpack-react-data-sync-client';
import { replaceEqualDeep, useMutationState } from '@tanstack/react-query';
import { z } from 'zod';
import { __ } from '@wordpress/i18n';
import { useRegenerationReason } from './suggest-regenerate';
import { useSingleModuleState } from '$features/module/lib/stores';

const STATE_QUERY_KEY = [ 'critical_css_state' ];

// Timestamps are server microtime, so this is the smallest step that still orders two of them.
const JUST_AFTER = 0.000001;

/**
 * Hook for accessing and writing to the overall Critical CSS state. Returns the current state, a setter
 * function, and whether the state is being re-read from the site. The setter function overwrites the whole
 * CSS state, providers and all - so is generally only useful when resetting the state for an error or to
 * ungenerated state.
 */
export function useCriticalCssState(): [
	CriticalCssState,
	( state: CriticalCssState ) => void,
	{ isFetching: boolean },
] {
	const [ cloudCss ] = useSingleModuleState( 'cloud_css' );
	const [ criticalCss ] = useSingleModuleState( 'critical_css' );
	const enabled = cloudCss?.active || criticalCss?.active;

	const [ { data, isFetching }, { mutate } ] = useDataSync(
		'jetpack_boost_ds',
		'critical_css_state',
		CriticalCssStateSchema,
		{
			query: {
				refetchInterval: query => {
					if ( ! enabled ) {
						return false;
					}

					return query.state.data?.status === 'pending' ? 2000 : 30000;
				},
				structuralSharing: keepNewerCriticalCssState,
			},
		}
	);

	if ( ! data ) {
		throw new Error( 'Critical CSS state not available' );
	}

	return [ data, mutate, { isFetching } ];
}

/**
 * Whether `fetched` was written before the state the dashboard holds: a copy of the same request taken
 * earlier, or a state of another request written before the held request existed. A state the site
 * rewrote later, even for an older request, is not earlier.
 *
 * @param {CriticalCssState} fetched - The state that was just fetched or set.
 * @param {CriticalCssState} held    - The state in the query cache.
 */
function isWrittenBefore( fetched: CriticalCssState, held: CriticalCssState ): boolean {
	const written = fetched.updated ?? fetched.created;
	if ( ! written || ! held.created ) {
		return false;
	}

	if ( fetched.created === held.created ) {
		return !! held.updated && written < held.updated;
	}

	return written < held.created;
}

// Set while a failed action restores the state it replaced, which is older by definition.
let restoringReplacedState = false;

/**
 * Keep the state the dashboard holds when a fetched copy was written before it. Without this, a reply
 * that arrives late or out of order would show an earlier result as the current one and stop or
 * restart the run in progress.
 *
 * @param {unknown} current  - The state in the query cache.
 * @param {unknown} incoming - The state that was just fetched or set.
 */
export function keepNewerCriticalCssState( current: unknown, incoming: unknown ): unknown {
	const held = current as CriticalCssState | undefined;
	const fetched = incoming as CriticalCssState;

	if ( held && ! restoringReplacedState && isWrittenBefore( fetched, held ) ) {
		return held;
	}

	return replaceEqualDeep( held, fetched );
}

/**
 * A state the browser makes while it waits on the site, placed just after the state it replaces so
 * that copies written up to that point are not taken for a newer one.
 *
 * @param {CriticalCssState} state    - The state to stamp.
 * @param {CriticalCssState} replaced - The state it replaces.
 */
function placedAfter( state: CriticalCssState, replaced?: CriticalCssState ): CriticalCssState {
	const reference = replaced?.updated ?? replaced?.created;
	if ( ! reference ) {
		return state;
	}

	return { ...state, created: reference + JUST_AFTER, updated: reference + JUST_AFTER };
}

/**
 * Whether a Regenerate reply carries a new pending request. A poll can bring that request in before
 * the reply lands, so the reply is refused only when it was written before the state the dashboard holds.
 *
 * @param {CriticalCssState} reply - The state the action returned.
 * @param {CriticalCssState} held  - The state in the query cache when the reply arrived.
 */
function startsNewRequest( reply: CriticalCssState, held: CriticalCssState | undefined ): boolean {
	return reply.status === 'pending' && ( ! held || ! isWrittenBefore( reply, held ) );
}

/**
 * The latest Regenerate attempt that the site refused, from any button, with the request it replaced.
 */
export function useRegenerateRefusal(): { error: unknown; replacedCreated?: number } | null {
	const attempts = useMutationState( {
		filters: {
			mutationKey: STATE_QUERY_KEY,
			predicate: mutation => mutation.options.meta?.action === 'request-regenerate',
		},
		select: mutation => ( {
			status: mutation.state.status,
			error: mutation.state.error,
			submittedAt: mutation.state.submittedAt,
			replacedCreated: (
				mutation.state.context as { previousValue?: CriticalCssState } | undefined
			 )?.previousValue?.created,
		} ),
	} );

	const latest = attempts.reduce< ( typeof attempts )[ number ] | undefined >(
		( newest, attempt ) =>
			! newest || attempt.submittedAt > newest.submittedAt ? attempt : newest,
		undefined
	);

	return latest?.status === 'error'
		? { error: latest.error, replacedCreated: latest.replacedCreated }
		: null;
}

/**
 * Helper for creating a valid Critical CSS error state object with the given message.
 *
 * @param {string} message - The error message.
 */
export function criticalCssErrorState( message: string ): CriticalCssState {
	return {
		providers: [],
		status: 'error',
		status_error: message,
	};
}

/**
 * All Critical CSS State actions return a success flag and the new state. This hook wraps the
 * common logic for handling the result of these actions.
 *
 * @param {string}    action     - The name of the action.
 * @param {z.ZodType} schema     - The schema for the action request.
 * @param {Function}  optimistic - Optional state to show while the action runs, from the state it replaces.
 * @param {Function}  onSuccess  - Optional callback for handling the new state.
 */
function useCriticalCssAction< ActionSchema extends z.ZodType >(
	action: string,
	schema: ActionSchema,
	optimistic?: ( replaced: CriticalCssState ) => CriticalCssState,
	onSuccess?: ( state: CriticalCssState ) => void
) {
	const responseSchema = z.object( {
		success: z.boolean(),
		state: CriticalCssStateSchema,
		error: z.string().optional(),
	} );

	// A bit annoying: you have to specify ALL template params when specifying any.
	// Template params must be specified here, otherwise action request schema of z.void doesn't work.
	return useDataSyncAction<
		typeof CriticalCssStateSchema,
		typeof responseSchema,
		typeof schema,
		z.infer< typeof schema >,
		z.infer< typeof responseSchema >,
		CriticalCssState
	>( {
		namespace: 'jetpack_boost_ds',
		key: 'critical_css_state',
		action_name: action,
		schema: {
			state: CriticalCssStateSchema,
			action_request: schema,
			action_response: responseSchema,
		},
		mutationOptions: {
			meta: { action },
			// Put back the state the action replaced; see restoringReplacedState.
			onError: ( _error, _request, context ) => {
				if ( ! context?.previousValue ) {
					return;
				}
				restoringReplacedState = true;
				try {
					queryClient.setQueryData( STATE_QUERY_KEY, context.previousValue );
				} finally {
					restoringReplacedState = false;
				}
			},
		},
		callbacks: {
			optimisticUpdate: ( _requestData, state: CriticalCssState ) => {
				return optimistic ? optimistic( state ) : state;
			},
			onResult: ( result, held ): CriticalCssState => {
				if ( result.success ) {
					if ( action === 'request-regenerate' && ! startsNewRequest( result.state, held ) ) {
						return placedAfter(
							criticalCssErrorState(
								__(
									'Critical CSS generation did not start. Reload the page and try again.',
									'jetpack-boost'
								)
							),
							held
						);
					}

					if ( onSuccess ) {
						onSuccess( result.state );
					}

					return result.state;
				}

				if (
					action === 'set-provider-css' &&
					( result.state.status === 'error' ||
						result.state.providers.some( provider => provider.status === 'error' ) )
				) {
					return result.state;
				}

				const message = result.error || __( 'Critical CSS action failed', 'jetpack-boost' );
				return criticalCssErrorState( message );
			},
		},
	} );
}

/**
 * Hook which creates a callable action for writing generated CSS for a provider key. Returns a new
 * async function that can be called directly.
 */
export function useSetProviderCssAction() {
	return useCriticalCssAction(
		'set-provider-css',
		z.object( {
			key: z.string(),
			css: z.string(),
		} )
	);
}

/**
 * Hook which creates a callable action for dismissing or undismissing a specific provider error.
 */
export function useSetProviderErrorDismissedAction() {
	return useCriticalCssAction(
		'set-provider-errors-dismissed',
		z.array(
			z.object( {
				provider: z.string(),
				error_type: z.string(),
				dismissed: z.boolean(),
			} )
		)
	);
}

/**
 * Hook which creates a callable action for storing a provider key error.
 */
export function useSetProviderErrorsAction() {
	return useCriticalCssAction(
		'set-provider-errors',
		z.object( {
			key: z.string(),
			errors: z.array( CriticalCssErrorDetailsSchema ),
		} )
	);
}

/**
 * Hook which creates a callable action for regenerating Critical CSS.
 *
 * @param {Function} callback - Optional callback to call when a regeneration starts successfully.
 */
export function useRegenerateCriticalCssAction( callback?: () => void ) {
	const [ , resetReason ] = useRegenerationReason();

	const onSuccess = () => {
		if ( callback ) {
			callback();
		}

		resetReason();
	};

	// Show the pending state at once, placed after the state it replaces so older copies stay out.
	const optimistic = ( replaced: CriticalCssState ) =>
		placedAfter( { status: 'pending', providers: [] }, replaced );
	return useCriticalCssAction( 'request-regenerate', z.void(), optimistic, onSuccess );
}

/**
 * Given a set of CSS Provider states, and optionally the local generator progress through the current
 * provider, calculate the overall progress of the Critical CSS generation.
 *
 * @param {Provider[]} providers        - The set of CSS Providers
 * @param {number}     providerProgress - Absolute progress fraction (0-1) across all providers.
 */
export function calculateCriticalCssProgress(
	providers: Provider[],
	providerProgress: number = 0
): number {
	if ( providers.length === 0 ) {
		return 0;
	}
	const count = providers.length;
	const done = providers.filter( provider => provider.status !== 'pending' ).length;
	const serverProgress = done / count;
	// Use whichever is higher to prevent backward jumps when server and
	// client state update in different render batches.
	return Math.min( 100, 100 * Math.max( serverProgress, providerProgress ) );
}

export function useProxyNonce() {
	const [ { data: meta } ] = useDataSync(
		'jetpack_boost_ds',
		'critical_css_meta',
		z.object( {
			proxy_nonce: z.string().optional(),
		} )
	);

	if ( ! meta || ! meta.proxy_nonce ) {
		throw new Error( 'Proxy nonce not available' );
	}

	return meta?.proxy_nonce;
}
