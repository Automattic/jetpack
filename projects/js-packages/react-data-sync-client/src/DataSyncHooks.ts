import {
	type UseQueryOptions,
	type UseQueryResult,
	type UseMutationOptions,
	type UseMutationResult,
	QueryClient,
	useQuery,
	useMutation,
	QueryClientProvider,
} from '@tanstack/react-query';
import React from 'react';
import { useRef, useEffect } from 'react';
import { z } from 'zod';
import { DataSync } from './DataSync';
import { DataSyncError } from './DataSyncError';

/**
 * @REACT-TODO This is temporary. We need to allow each app to define their own QueryClient.
 * All of the functions below will have to be moved to a factory wrapper
 */
export const queryClient = new QueryClient();

export function invalidateQuery( key: string ) {
	queryClient.invalidateQueries( { queryKey: [ key ] } );
}

/**
 * React Query Provider for DataSync.
 * This is necessary for React Query to work.
 * @see https://tanstack.com/query/v5/docs/react/reference/QueryClientProvider
 */
export function DataSyncProvider( props: { children: React.ReactNode } ) {
	return QueryClientProvider( {
		client: queryClient,
		...props,
	} );
}

/**
 * React Query configuration type for DataSync.
 */
type DataSyncMutation< Value > = Omit< UseMutationOptions< Value >, 'mutationKey' >;
type DataSyncQuery< Value > = Omit< UseQueryOptions< Value >, 'queryKey' >;
type DataSyncConfig< Schema extends z.ZodSchema, Value extends z.infer< Schema > > = {
	query?: DataSyncQuery< Value >;
	mutation?: DataSyncMutation< Value >;
};
/**
 * This is what `useDataSync` returns
 */
type DataSyncHook< Schema extends z.ZodSchema, Value extends z.infer< Schema > > = [
	UseQueryResult< Value >,
	UseMutationResult< Value, DataSyncError | Error, Value >,
];

/**
 * Build a query key from a key and params.
 *
 * @param {string} key    - The key of the value that's being synced.
 * @param {Object} params - key/value pairs to be used as arguments to the query parameters.
 */
function buildQueryKey( key: string, params: Record< string, string | number > ) {
	return [
		key,
		...Object.entries( params )
			.sort( ( [ a ], [ b ] ) => a.localeCompare( b ) )
			.map( ( [ , v ] ) => v ),
	];
}

/**
 * React Query hook for DataSync.
 * @param namespace - The namespace of the endpoint.
 * @param key - The key of the value that's being synced.
 * @param schema - The Zod schema to validate the value against.
 * @param config - React Query configuration.
 * @param params - key/value pairs to be used as GET parameters.
 * @returns A tuple of React Query hooks.
 * @see https://tanstack.com/query/v5/docs/react/reference/useQuery
 * @see https://tanstack.com/query/v5/docs/react/reference/useMutation
 */
export function useDataSync<
	Schema extends z.ZodSchema,
	Value extends z.infer< Schema >,
	Key extends string,
>(
	namespace: string,
	key: Key,
	schema: Schema,
	config: DataSyncConfig< Schema, Value > = {},
	params: Record< string, string | number > = {}
): DataSyncHook< Schema, Value > {
	// AbortController is used to track rapid value mutations
	// and will cancel in-flight requests and prevent
	// the optimistic value from being reverted.
	const abortController = useRef< AbortController | null >( null );
	const datasync = new DataSync( namespace, key, schema );
	const queryKey = buildQueryKey( key, params );

	/**
	 * Defaults for `useQuery`:
	 * - `queryKey` is the key of the value that's being synced.
	 * - `queryFn` is wired up to DataSync `GET` method.
	 * - `initialData` gets the value from the global window object.
	 * - `staleTime` is set to 1 second by default; to prevent immediate re-fetching after setting a value.
	 *
	 * If your property is lazy-loaded, you should populate `initialData` with a value manually.
	 * ```js
	 * 		const [ data ] = useDataSync( 'namespace', 'key', schema, {
	 * 			initialData: { foo: 'bar' },
	 * 		} );
	 * ```
	 */
	const queryConfigDefaults = {
		queryKey,
		queryFn: ( { signal } ) => datasync.GET( params, signal ),
		staleTime: 1 * 1000,
		initialData: () => {
			try {
				return datasync.getInitialValue();
			} catch ( e ) {
				return;
			}
		},
	};

	/**
	 * Defaults for `useMutation`:
	 * - `mutationKey` is the key of the value that's being synced.
	 * - `mutationFn` is wired up to DataSync `SET` method.
	 * - `onMutate` is used to optimistically update the value before the request is made.
	 * - `onError` is used to revert the value back to the previous value if the request fails.
	 * - `onSettled` is used to invalidate the query after the request is made.
	 *
	 * @see https://tanstack.com/query/v5/docs/react/guides/optimistic-updates
	 */
	const mutationConfigDefaults = {
		mutationKey: queryKey,

		// Mutation function that's called when the mutation is triggered
		mutationFn: value => datasync.SET( value, params, abortController.current.signal ),

		// Mutation actions that occur before the mutationFn is called
		onMutate: async data => {
			// If there's an existing mutation in progress, cancel it
			if ( abortController.current ) {
				abortController.current.abort();
			}
			// Create a new AbortController for the upcoming request
			abortController.current = new AbortController();

			const value = schema.parse( data );

			// Cancel any outgoing refetches
			// (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries( { queryKey } );

			// Snapshot the previous value
			const previousValue = queryClient.getQueryData( queryKey );

			// Optimistically update the cached state to the new value
			queryClient.setQueryData( queryKey, value );

			// Return a context object with the snapshotted value
			return { previousValue, optimisticValue: value };
		},
		onError: ( err, _, context ) => {
			if ( err instanceof DataSyncError && err.isAborted() ) {
				// If the request was aborted, this means that another mutation
				// has already been dispatched and has already updated
				// the optimistic value, so there's nothing to revert.
				return;
			}
			// Revert the optimistic update to the previous value on error
			queryClient.setQueryData( queryKey, context.previousValue );
		},
		onSuccess: ( data: Value ) => {
			queryClient.setQueryData( queryKey, data );
		},
		onSettled: ( _, error ) => {
			// Clear the abortController on either success or failure that is not an abort
			if ( ! error || ( error instanceof DataSyncError && ! error.isAborted() ) ) {
				abortController.current = null;
			}
		},
	};

	return [
		useQuery( { ...queryConfigDefaults, ...config.query } ),
		useMutation( { ...mutationConfigDefaults, ...config.mutation } ),
	];
}

/**
 * Use React Query mutations to dispatch custom DataSync Actions.
 */
export type DataSyncActionConfig<
	ActionRequestSchema extends z.ZodSchema,
	ActionRequestData extends z.infer< ActionRequestSchema >,
	StateSchema extends z.ZodSchema,
	ActionSchema extends z.ZodSchema,
	ActionResult extends z.infer< ActionSchema >,
	CurrentState extends z.infer< StateSchema >,
> = {
	/**
	 * The project namespace, for example: 'jetpack_boost_ds'
	 */
	namespace: string;

	/**
	 * The name of the DataSync option.
	 */
	key: string;

	/**
	 * The name of the DataSync action.
	 */
	action_name: string;

	/**
	 * The Zod schema for the DataSync state.
	 */
	schema: {
		/**
		 * The DataSync state schema
		 */
		state: StateSchema;
		/**
		 * The action endpoint response schema.
		 */
		action_response: ActionSchema;
		/**
		 * Data that's sent to the action endpoint.
		 */
		action_request: ActionRequestSchema;
	};
	callbacks?: {
		/**
		 * Callback that's called when the action is dispatched.
		 * This is useful for optimistic updates, must return the new state.
		 */
		optimisticUpdate?: ( requestData: ActionRequestData, state: CurrentState ) => CurrentState;
		/**
		 * Callback that's called after the action endpoint response is received.
		 * If a state object is returned, it will be used to update the state.
		 */
		onResult?: ( result: ActionResult, state: CurrentState ) => void | CurrentState;
	};
	/**
	 * React Query mutation options passed to `useMutate`.
	 * @see https://tanstack.com/query/v5/docs/react/reference/useMutation
	 */
	mutationOptions?: UseMutationOptions<
		ActionResult,
		unknown,
		ActionRequestData,
		{ previousValue: CurrentState }
	>;
	/**
	 * GET parameters to be passed to the action endpoint.
	 * These are used to build the query key.
	 * @see https://tanstack.com/query/v5/docs/guides/query-keys
	 */
	params?: Record< string, string | number >;
};
export function useDataSyncAction<
	StateSchema extends z.ZodSchema,
	ActionSchema extends z.ZodSchema,
	ActionRequestSchema extends z.ZodSchema,
	ActionRequestData extends z.infer< ActionRequestSchema >,
	ActionResult extends z.infer< ActionSchema >,
	CurrentState extends z.infer< StateSchema >,
>( {
	namespace,
	key,
	action_name,
	schema,
	callbacks = {},
	mutationOptions,
	params = {},
}: DataSyncActionConfig<
	ActionRequestSchema,
	ActionRequestData,
	StateSchema,
	ActionSchema,
	ActionResult,
	CurrentState
> ) {
	const queryKey = buildQueryKey( key, params );
	const datasync = new DataSync( namespace, key, schema.state );
	const mutationConfigDefaults: UseMutationOptions<
		ActionResult,
		unknown,
		ActionRequestData,
		{
			previousValue: CurrentState;
		}
	> = {
		mutationKey: queryKey,
		mutationFn: async ( value: ActionRequestData ) => {
			const result = await datasync.ACTION(
				action_name,
				schema.action_request.parse( value ),
				schema.action_response
			);
			try {
				const currentValue = queryClient.getQueryData< CurrentState >( queryKey );
				const processedResult = await callbacks.onResult( result, currentValue );

				const data =
					processedResult === undefined ? currentValue : schema.state.parse( processedResult );
				if ( processedResult !== undefined ) {
					queryClient.setQueryData( queryKey, data );
				}
				return data;
			} catch ( e ) {
				return queryClient.getQueryData( queryKey );
			}
		},
		onMutate: async ( requestData: ActionRequestData ) => {
			// Cancel any outgoing refetches
			// (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries( { queryKey: queryKey } );

			// Snapshot the previous value
			const previousValue = queryClient.getQueryData< CurrentState >( queryKey );

			if ( callbacks.optimisticUpdate ) {
				const value = await callbacks.optimisticUpdate( requestData, previousValue );
				queryClient.setQueryData( queryKey, value );
			}

			// Return a context object with the snapshotted value
			return { previousValue };
		},
		onError: ( _, __, context ) => {
			queryClient.setQueryData( queryKey, context.previousValue );
		},
		onSettled: () => {
			queryClient.invalidateQueries( { queryKey } );
		},
	};

	return useMutation< DataSyncMutation< CurrentState >, unknown, ActionRequestData >( {
		...mutationConfigDefaults,
		...mutationOptions,
	} );
}

type SubsetMutation< T > = {
	mutate: ( newValue: T ) => void;
	isIdle: boolean;
	isSuccess: boolean;
	isPending: boolean;
	isError: boolean;
	error: Error | null;
	reset: () => void;
};

export function useDataSyncSubset<
	Schema extends z.ZodSchema,
	Value extends z.infer< Schema >,
	K extends keyof Value,
>( hook: DataSyncHook< Schema, Value >, key: K ): [ Value[ K ], SubsetMutation< Value[ K ] > ] {
	const [ query, mutation ] = hook;
	const [ isPending, setIsPending ] = React.useState( false );
	const [ isError, setIsError ] = React.useState( false );
	const [ isSuccess, setIsSuccess ] = React.useState( false );
	const [ isIdle, setIsIdle ] = React.useState( true );
	const [ error, setError ] = React.useState< unknown >( null );

	const mutate = React.useCallback(
		( newValue: Value[ K ] ) => {
			if ( ! query.data ) {
				return;
			}
			setIsPending( true );
			mutation.mutate( {
				...query.data,
				[ key ]: newValue,
			} );
		},
		[ query.data, mutation, key ]
	);

	const reset = React.useCallback( () => {
		setIsPending( false );
		setIsError( false );
		setIsSuccess( false );
		setIsIdle( true );
		setError( null );
	}, [] );

	useEffect( () => {
		if ( ! isPending ) {
			return;
		}
		setIsError( mutation.isError );
		setIsSuccess( mutation.isSuccess );
		setError( mutation.error );
		if ( mutation.isSuccess || mutation.isError ) {
			setIsPending( false );
		}
	}, [ mutation.isError, mutation.error, mutation.isSuccess, isPending ] );

	return [
		query.data?.[ key ],
		{
			isIdle,
			isSuccess,
			isPending,
			isError,
			error,
			mutate,
			reset,
		},
	];
}
