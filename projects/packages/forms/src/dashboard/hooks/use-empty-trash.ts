/**
 * Internal dependencies
 */
import useEmptyResponses, { type UseEmptyResponsesReturn } from './use-empty-responses';

type UseEmptyTrashReturn = Omit< UseEmptyResponsesReturn, 'totalItems' > & {
	totalItemsTrash: number;
};

/**
 * Hook to manage empty trash functionality.
 *
 * @param props                 - Optional props.
 * @param props.totalItemsTrash - The total number of trash items (optional, will use hook if not provided).
 * @return Object with empty trash state and handlers.
 */
export default function useEmptyTrash( {
	totalItemsTrash: totalItemsTrashProp,
}: {
	totalItemsTrash?: number;
} = {} ): UseEmptyTrashReturn {
	const { totalItems, ...rest } = useEmptyResponses( {
		flow: 'trash',
		totalItemsProp: totalItemsTrashProp,
	} );

	return { ...rest, totalItemsTrash: totalItems };
}
