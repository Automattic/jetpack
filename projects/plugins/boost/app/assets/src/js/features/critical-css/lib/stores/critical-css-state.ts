import { CriticalCssErrorDetailsSchema, CriticalCssStateSchema } from './critical-css-state-types';
import type { CriticalCssState, Provider } from './critical-css-state-types';
import { useDataSync, useDataSyncAction } from '@automattic/jetpack-react-data-sync-client';
import { replaceEqualDeep } from '@tanstack/react-query';
import { z } from 'zod';
import { __ } from '@wordpress/i18n';
import { useRegenerationReason } from './suggest-regenerate';
import { useSingleModuleState } from '$features/module/lib/stores';

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
 * Whether `candidate` is an earlier moment of the state than `reference`: an earlier generation
 * request, or an earlier snapshot of the same request.
 *
 * @param {CriticalCssState} candidate - The state being compared.
 * @param {CriticalCssState} reference - The state it is compared against.
 */
function isEarlierState( candidate: CriticalCssState, reference: CriticalCssState ): boolean {
	if ( ! candidate.created || ! reference.created ) {
		return false;
	}

	if ( candidate.created !== reference.created ) {
		return candidate.created < reference.created;
	}

	return !! candidate.updated && !! reference.updated && candidate.updated < reference.updated;
}

/**
 * Keep the state the dashboard holds when a fetched copy is older than it. A cache between the browser
 * and the site can answer the state poll with a copy taken before Regenerate was clicked; accepting it
 * would show the old result as finished and stop the run that is still generating.
 *
 * @param {unknown} current  - The state in the query cache.
 * @param {unknown} incoming - The state that was just fetched or set.
 */
export function keepNewerCriticalCssState( current: unknown, incoming: unknown ): unknown {
	const held = current as CriticalCssState | undefined;
	const fetched = incoming as CriticalCssState;

	if ( held && isEarlierState( fetched, held ) ) {
		return held;
	}

	return replaceEqualDeep( held, fetched );
}

/**
 * Whether a Regenerate reply carries the new pending request rather than a copy of the state it replaced.
 *
 * @param {CriticalCssState} state           - The state the action returned.
 * @param {number}           replacedCreated - The `created` time of the request Regenerate replaced.
 */
function startsNewRequest( state: CriticalCssState, replacedCreated: number | undefined ): boolean {
	return (
		state.status === 'pending' && ( ! replacedCreated || ( state.created ?? 0 ) > replacedCreated )
	);
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
 * @param {string}           action          - The name of the action.
 * @param {z.ZodType}        schema          - The schema for the action request.
 * @param {CriticalCssState} optimisticState - The state to use for optimistic updates.
 * @param {Function}         onSuccess       - Optional callback for handling the new state.
 */
function useCriticalCssAction< ActionSchema extends z.ZodType >(
	action: string,
	schema: ActionSchema,
	optimisticState?: CriticalCssState,
	onSuccess?: ( state: CriticalCssState ) => void
) {
	const responseSchema = z.object( {
		success: z.boolean(),
		state: CriticalCssStateSchema,
		error: z.string().optional(),
	} );

	// The request a Regenerate click replaces, so a reply that did not start a new one is caught.
	// Both callbacks below come from the same mutation options, so a plain variable carries it.
	let replacedCreated: number | undefined;

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
		callbacks: {
			optimisticUpdate: ( _requestData, state: CriticalCssState ) => {
				replacedCreated = state?.created;

				if ( optimisticState ) {
					return optimisticState;
				}

				return state;
			},
			onResult: ( result, _state ): CriticalCssState => {
				if ( result.success ) {
					if (
						action === 'request-regenerate' &&
						! startsNewRequest( result.state, replacedCreated )
					) {
						return criticalCssErrorState(
							__(
								'Critical CSS generation did not start. Reload the page and try again.',
								'jetpack-boost'
							)
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

	// Optimistically update the state to hide any errors and immediately show the pending state.
	const optimisticState: CriticalCssState = { status: 'pending', providers: [] };
	return useCriticalCssAction( 'request-regenerate', z.void(), optimisticState, onSuccess );
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
