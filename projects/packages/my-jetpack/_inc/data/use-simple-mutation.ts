import { useMutation } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { useFetchingErrorNotice } from './notices/use-fetching-error-notice';
import type { UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import type { APIFetchOptions } from '@wordpress/api-fetch';

type APIFetchOptionsWithQueryParams = APIFetchOptions & {
	queryParams?: Record< string, string | Array< string > | object >;
};

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
type QueryParams< T, E, V > = {
	name: string;
	query: APIFetchOptions;
	options?: Pick< UseMutationOptions< T, E, V >, 'onSuccess' >;
	errorMessage?: string;
};
const useSimpleMutation = <
	T = void,
	E = Error,
	V extends object = APIFetchOptionsWithQueryParams,
>( {
	name,
	query,
	options,
	errorMessage,
}: QueryParams< T, E, V > ) => {
	const mutationResult = useMutation< T, E, V >( {
		mutationKey: [ name ],
		mutationFn: ( variables?: V ) => {
			const finalQuery = Object.assign( {}, query ); // copy object

			if ( variables && 'queryParams' in variables ) {
				// Add query parameters to the path and remove it from query options
				finalQuery.path = addQueryArgs( finalQuery.path, variables.queryParams );
				delete variables.queryParams;
			}

			return apiFetch< T >( { ...finalQuery, ...variables } );
		},
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
