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
import { DataSync, RequestParams } from './DataSync';

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
export function useDataSyncAction< ActionData extends RequestParams >() {
	/*
	 * Yes, this is a function that returns a function.
	 * Also yes - this is dumb.
	 * But TypeScript still doesn't allow partial type inference.
	 *
	 * This is what happens when you rush development
	 * - you get legacy code that can't be fixed for years.
	 * @see https://github.com/microsoft/TypeScript/issues/26242
	 */

	return function <
		Schema extends z.ZodSchema,
		State extends z.infer< Schema >,
		Key extends string,
		ActionName extends string,
		ActionSchema extends z.ZodSchema,
		ActionResult extends z.infer< ActionSchema >,
		Config extends DataSyncConfig< ActionSchema, ActionData >[ 'mutation' ],
	>(
		namespace: string,
		key: Key,
		name: ActionName,
		stateSchema: Schema,
		actionSchema: ActionSchema,
		callback: ( result: ActionResult, currentValue: State ) => void | State,
		config: Config = {} as Config,
		params: Record< string, string | number > = {}
	) {
		const datasync = new DataSync( namespace, key, stateSchema );
		// @TODO: order sensitive bug is hiding in Object.values
		// This `sort` of fixes it, but I'd like a more elegant solution.
		const queryKey = [ key, ...Object.values( params ).sort() ];
		const mutationConfigDefaults: UseMutationOptions<
			ActionResult,
			unknown,
			ActionData,
			{
				previousValue: State;
			}
		> = {
			mutationKey: queryKey,
			mutationFn: async ( value: ActionData ) => {
				const result = await datasync.ACTION( name, value, actionSchema );
				try {
					const currentValue = queryClient.getQueryData< State >( queryKey );
					const processedResult = await callback( result, currentValue );

					const data =
						processedResult === undefined ? currentValue : stateSchema.parse( processedResult );
					if ( processedResult !== undefined ) {
						queryClient.setQueryData( queryKey, data );
					}
					return data;
				} catch ( e ) {
					return queryClient.getQueryData( queryKey );
				}
			},
			onMutate: async () => {
				// Cancel any outgoing refetches
				// (so they don't overwrite our optimistic update)
				await queryClient.cancelQueries( { queryKey } );

				// Snapshot the previous value
				const previousValue = queryClient.getQueryData< State >( queryKey );

				// Optimistically update the cached state to the new value
				// @TODO: We need a way to render optimistic updates
				// Right now the provided `callback` function can "compose" the new state from the returned data
				// But there's no mechanism to "compose" an optimistic update - that should go here.
				// This is what DataSync is doing, but "value" doesn't work here for us.
				// queryClient.setQueryData( queryKey, value );

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

		return useMutation< Config, unknown, ActionData >( {
			...mutationConfigDefaults,
			...config,
		} );
	};
}
