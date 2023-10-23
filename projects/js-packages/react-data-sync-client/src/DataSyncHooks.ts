import useSWR from 'swr';
import useSWRMutation, { SWRMutationConfiguration } from 'swr/mutation';
import { z } from 'zod';
import { DataSync } from './DataSync';
import type { SWRConfiguration } from 'swr';

export function useDataSync<
	Schema extends z.ZodSchema,
	Value extends z.infer< Schema >,
	Key extends string,
>( namespace: string, key: Key, schema: Schema, config: SWRConfiguration = {} ) {
	type MutationArguments = {
		arg: Value;
	};
	const datasync = new DataSync( namespace, key, schema );
	const { trigger, isMutating } = useSWRMutation< Value >(
		key,
		async ( _, data: MutationArguments ) => {
			const value = data.arg; // schema.parse( data.arg );
			const response = await datasync.SET( value );
			// eslint-disable-next-line no-console
			console.log( 'Response', response );
			return response;
		}
	);
	const { data, error } = useSWR< Value >( key, datasync.GET, {
		fallbackData: datasync.getInitialValue(),
		revalidateOnMount: false,
		...config,
	} );

	if ( error ) {
		// eslint-disable-next-line no-console
		console.log( `Error happened`, error );
	}

	return {
		data,
		error,
		mutate: (
			d: Value,
			options: SWRMutationConfiguration< Value, unknown, Key, never, Value > = {}
		) => {
			trigger( d, {
				optimisticData: d,
				...options,
			} );
		},
		isMutating,
	};
}

export function useReadonlyDataSync< Schema extends z.ZodSchema, Key extends string >(
	namespace: string,
	key: Key,
	schema: Schema,
	config: SWRConfiguration = {}
) {
	const datasync = new DataSync( namespace, key, schema );
	const { data, error } = useSWR( key, datasync.GET, {
		fallbackData: datasync.getInitialValue(),
		revalidateOnFocus: false,
		revalidateOnMount: false,
		...config,
	} );

	if ( error ) {
		// eslint-disable-next-line no-console
		console.log( `Error happened`, error );
	}

	return {
		data,
		error,
	};
}
