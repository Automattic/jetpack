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
import { z } from 'zod';
import { DataSync } from './DataSync';

const queryClient = new QueryClient();

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
type DataSyncConfig< Schema extends z.ZodSchema, Value extends z.infer< Schema > > = {
	query?: Omit< UseQueryOptions< Value >, 'queryKey' >;
	mutation?: Omit< UseMutationOptions< Value >, 'mutationKey' >;
};
/**
 * This is what `useDataSync` returns
 */
type DataSyncHook< Schema extends z.ZodSchema, Value extends z.infer< Schema > > = [
	UseQueryResult< Value >,
	UseMutationResult< Value >,
];

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
	const datasync = new DataSync( namespace, key, schema );
	const queryKey = [ key, ...Object.values( params ).sort() ];
	/**
	 * Defaults for `useQuery`:
	 * - `queryKey` is the key of the value that's being synced.
	 * - `queryFn` is wired up to DataSync `GET` method.
	 * - `initialData` gets the value from the global window object.
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
		initialData: datasync.getInitialValue(),
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
		mutationFn: value => datasync.SET( value, params ),
		onMutate: async data => {
			const value = schema.parse( data );

			// Cancel any outgoing refetches
			// (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries( { queryKey } );

			// Snapshot the previous value
			const previousValue = queryClient.getQueryData( queryKey );

			// Optimistically update the cached state to the new value
			queryClient.setQueryData( queryKey, value );

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

	return [
		useQuery( { ...queryConfigDefaults, ...config.query } ),
		useMutation( { ...mutationConfigDefaults, ...config.mutation } ),
	];
}

/**
 * Use React Query mutations to dispatch custom DataSync Actions.
 *
 * ### Usage:
 *
 * ```ts
 * const action = useDataSyncAction<{ foo: string }>()( 'namespace', 'key', 'action', schema, schema, callback );
 * ``` Notice double function call ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 *
 * ## Anatomy of a callback:
 * Return value to set the new state.
 * Throw an error to cancel.
 * Return undefined to keep the current state.
 * ```ts
 * callback: ( result: ActionResult, currentValue: State ) => void | State,
 * ```
 *
 * ### Trigger a mutation:
 * ```ts
 * action.mutate( { foo: 'bar' } );
 * ````
 *
 *
 */
type MutationOptions< Value > = Omit< UseMutationOptions< Value >, 'mutationKey' >;
export type DataSyncActionConfig<
	ActionRequestSchema extends z.ZodSchema,
	ActionRequestData extends z.infer< ActionRequestSchema >,
	StateSchema extends z.ZodSchema,
	ActionSchema extends z.ZodSchema,
	ActionResult extends z.infer< ActionSchema >,
	CurrentState extends z.infer< StateSchema >,
> = {
	namespace: string;
	key: string;
	action_name: string;
	schema: {
		state: StateSchema;
		action: ActionSchema;
		action_request: ActionRequestSchema;
	};
	callbacks?: {
		onResult?: ( result: ActionResult, state: CurrentState ) => void | CurrentState;
		optimisticUpdate?: ( requestData: ActionRequestData, state: CurrentState ) => CurrentState;
	};
	mutationOptions?: UseMutationOptions<
		ActionResult,
		unknown,
		ActionRequestData,
		{ previousValue: CurrentState }
	>;
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
	callbacks,
	mutationOptions,
	params,
}: DataSyncActionConfig<
	ActionRequestSchema,
	ActionRequestData,
	StateSchema,
	ActionSchema,
	ActionResult,
	CurrentState
> ) {
	// @TODO: order sensitive bug is hiding in Object.values
	// This `sort` of fixes it, but I'd like a more elegant solution.
	const queryKey = [ key, ...Object.values( params ).sort() ];
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
				schema.action
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
			await queryClient.cancelQueries( { queryKey } );

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

	return useMutation< MutationOptions< CurrentState >, unknown, ActionRequestData >( {
		...mutationConfigDefaults,
		...mutationOptions,
	} );
}
