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

export function DataSyncProvider( props: { children: React.ReactNode } ) {
	return QueryClientProvider( {
		client: queryClient,
		...props,
	} );
}

type DataSyncFactory< T > = {
	useQuery: ( config?: Omit< UseQueryOptions< T >, 'queryKey' > ) => UseQueryResult< T >;
	useMutation: (
		config?: Omit< UseMutationOptions< T >, 'mutationKey' >
	) => UseMutationResult< T >;
};

export function useDataSync<
	Schema extends z.ZodSchema,
	Value extends z.infer< Schema >,
	Key extends string,
>( namespace: string, key: Key, schema: Schema ): DataSyncFactory< Value > {
	const datasync = new DataSync( namespace, key, schema );
	const queryKey = [ key ];
	const queryConfigDefaults = {
		queryKey,
		queryFn: ( { signal } ) => datasync.GET( signal ),
		initialData: datasync.getInitialValue(),
	};
	const mutationConfigDefaults = {
		mutationKey: queryKey,
		mutationFn: datasync.SET,
		onMutate: async data => {
			const value = schema.parse( data );

			// Cancel any outgoing refetches
			// (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries( { queryKey } );

			// Snapshot the previous value
			const previousValue = queryClient.getQueryData( queryKey );

			// Optimistically update to the new value
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

	return {
		useQuery: ( config = {} ) => useQuery( { ...queryConfigDefaults, ...config } ),
		useMutation: ( config = {} ) => useMutation( { ...mutationConfigDefaults, ...config } ),
	};
}
