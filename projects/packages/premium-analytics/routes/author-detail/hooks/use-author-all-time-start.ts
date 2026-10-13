/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { toGmtInstant, useAuthorStats } from './use-author-stats';

export type AuthorAllTimeStart = {
	/** Where the author's all time starts, as a site-local day or a GMT instant; undefined until known. */
	allTimeStart?: string;
	/** Whether there is no start yet because it is loading or failed. */
	isPending: boolean;
	isError: boolean;
	error: unknown;
	refetch: () => void;
};

/**
 * Where all time starts for one author: the first day their views can start,
 * from the request the All-time traffic table already makes. An author past the
 * endpoint's post limit falls back to their first published content.
 *
 * @param authorId - The user ID from the route.
 * @return The start and its request state.
 */
export function useAuthorAllTimeStart( authorId: number ): AuthorAllTimeStart {
	const source = useAuthorStats( authorId );
	const { refetch } = source;

	const retry = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	let allTimeStart: string | undefined;
	// Another author's dates must not anchor this page while it loads.
	if ( ! source.isPlaceholderData && source.data ) {
		const { report, isApproximate } = source.data;
		allTimeStart = isApproximate
			? toGmtInstant( report.firstContentDate )
			: ( report.startDate ?? undefined );
	}

	return {
		allTimeStart: allTimeStart || undefined,
		// A background refetch that fails keeps the start it already has.
		isPending: ! allTimeStart && ( source.isLoading || source.isError ),
		isError: source.isError,
		error: source.error,
		refetch: retry,
	};
}
