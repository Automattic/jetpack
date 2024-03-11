import { useMutation } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { APIFetchOptions } from '@wordpress/api-fetch';

/**
 * Executes a mutation with the specified parameters and options. This hook is designed
 * for performing data modification operations (e.g., POST, PUT, DELETE requests) and handling
 * the mutation's lifecycle events, such as success or failure. Additionally, it can display
 * an error notice if the mutation encounters an error.
 *
 * @template T The type of data expected to be returned by the mutation.
 * @param {object} params - The parameters for executing the mutation.
 * @param {string} params.name - A unique name for the mutation, used as part of the mutation key.
 * @param {APIFetchOptions} params.query - The options to be passed to the API fetch function for the mutation.
 * @param {Pick<UseMutationOptions, 'onSuccess'>} [params.options] - Optional. Mutation options from react-query, currently supports only the 'onSuccess' option.
 * @param {string} [params.errorMessage] - Optional. A custom error message that can be displayed if the mutation fails.
 * @returns {UseMutationResult<T>} The result object from the useMutation hook, containing data and state information about the mutation (e.g., isPending, isError).
 */
type QueryParams = {
	name: string;
	query: APIFetchOptions;
	options?: Pick< UseMutationOptions, 'onSuccess' >;
	errorMessage?: string;
};
const useSimpleMutation = < T >( { name, query, options, errorMessage }: QueryParams ) => {
	const mutationResult = useMutation< T >( {
		mutationKey: [ name ],
		mutationFn: () => apiFetch< T >( query ),
		...options,
	} );

	const { isError, isPending } = mutationResult;

	useFetchingErrorNotice( {
		infoName: name,
		isError: ! isPending && isError,
		overrideMessage: errorMessage,
	} );

	return mutationResult;
};

export default useSimpleMutation;
