import { CriticalCssErrorDetailsSchema, CriticalCssStateSchema } from './critical-css-state-types';
import type { CriticalCssState, Provider } from './critical-css-state-types';
import { useDataSync, useDataSyncAction } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
import { __ } from '@wordpress/i18n';
import { useRegenerationReason } from './suggest-regenerate';
import { useSingleModuleState } from '$features/module/lib/stores';

/**
 * Hook for accessing and writing to the overall Critical CSS state. Returns both the current state
 * and a setter function. The setter function overwrites the *entire* CSS state, providers and all -
 * so is generally only useful when resetting the state for an error or to ungenerated state.
 */
export function useCriticalCssState(): [ CriticalCssState, ( state: CriticalCssState ) => void ] {
	const [ cloudCss ] = useSingleModuleState( 'cloud_css' );
	const [ criticalCss ] = useSingleModuleState( 'critical_css' );
	const enabled = cloudCss?.active || criticalCss?.active;

	const [ { data }, { mutate } ] = useDataSync(
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
			},
		}
	);

	if ( ! data ) {
		throw new Error( 'Critical CSS state not available' );
	}

	return [ data, mutate ];
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
 * @param {string}      action    - The name of the action.
 * @param {z.ZodSchema} schema    - The schema for the action request.
 * @param {Function}    onSuccess - Optional callback for handling the new state.
 */
function useCriticalCssAction<
	ActionSchema extends z.ZodSchema,
	ActionRequestData extends z.infer< ActionSchema >,
>( action: string, schema: ActionRequestData, onSuccess?: ( state: CriticalCssState ) => void ) {
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
		callbacks: {
			onResult: ( result, _state ): CriticalCssState => {
				if ( result.success ) {
					if ( onSuccess ) {
						onSuccess( result.state );
					}

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
				key: z.string(),
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
 */
export function useRegenerateCriticalCssAction() {
	const [ , resetReason ] = useRegenerationReason();
	return useCriticalCssAction( 'request-regenerate', z.void(), resetReason );
}

/**
 * Given a set of CSS Provider states, and optionally the local generator progress through the current
 * provider, calculate the overall progress of the Critical CSS generation.
 *
 * @param {Provider[]} providers        - The set of CSS Providers
 * @param {number}     providerProgress - The progress through the current provider (optional).
 */
export function calculateCriticalCssProgress(
	providers: Provider[],
	providerProgress: number = 0
): number {
	const count = providers.length;
	const done = providers.filter( provider => provider.status !== 'pending' ).length;
	const totalProgress = 100 * ( done / count + providerProgress / count );

	return totalProgress;
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
