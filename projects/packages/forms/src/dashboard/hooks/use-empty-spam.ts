/**
 * Internal dependencies
 */
import useEmptyResponses, { type UseEmptyResponsesReturn } from './use-empty-responses';

type UseEmptySpamReturn = Omit< UseEmptyResponsesReturn, 'totalItems' > & {
	totalItemsSpam: number;
};

/**
 * Hook to manage empty spam functionality.
 *
 * @param props                - Optional props.
 * @param props.totalItemsSpam - The total number of spam items (optional, will use hook if not provided).
 * @return Object with empty spam state and handlers.
 */
export default function useEmptySpam( {
	totalItemsSpam: totalItemsSpamProp,
}: {
	totalItemsSpam?: number;
} = {} ): UseEmptySpamReturn {
	const { totalItems, ...rest } = useEmptyResponses( {
		flow: 'spam',
		totalItemsProp: totalItemsSpamProp,
	} );

	return { ...rest, totalItemsSpam: totalItems };
}
