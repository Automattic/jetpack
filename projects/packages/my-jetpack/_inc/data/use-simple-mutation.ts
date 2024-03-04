import { useMutation } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { APIFetchOptions } from '@wordpress/api-fetch';

interface Options extends UseMutationOptions {
	onSuccess?: ( data: unknown ) => void;
}

/*
 * Simple wrapper for useQuery that handles error notices.
 *
 * This query is meant for any methods that include updating data (e.g. POST or DELETE), if you need to use a GET request, use useSimpleQuery.
 *
 * The options object is optional and is a strictly defined subset of the UseMutationOptions type.
 * If you want to pass more options, you can add them to the options type above.
 */
const useSimpleMutation = < T >(
	name: string,
	query: APIFetchOptions,
	options?: Partial< Options >,
	explicitKey?: string,
	errorMessage?: string
): UseMutationResult< unknown > => {
	const mutationResult = useMutation( {
		mutationKey: [ name, explicitKey ],
		mutationFn: () => apiFetch< T >( query ),
		...options,
	} );

	const { isError, isPending } = mutationResult;

	useFetchingErrorNotice( name, ! isPending && isError, errorMessage );

	return mutationResult;
};

export default useSimpleMutation;
