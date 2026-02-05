/**
 * Internal dependencies
 */
import { preloadGlobalTabCounts } from '../../src/dashboard/wp-build/utils/preload';

export const route = {
	/**
	 * Preload data before the route renders.
	 */
	loader: async () => {
		await preloadGlobalTabCounts();
	},
	/**
	 * Render the editor canvas when editing a form from the list.
	 *
	 * @param props                   - Route props.
	 * @param props.search            - Search params.
	 * @param props.search.editFormId - Form ID to edit.
	 * @return Canvas data or undefined.
	 */
	canvas: ( { search }: { search: { editFormId?: number | string } } ) => {
		const editFormId =
			typeof search.editFormId === 'number' ? search.editFormId : Number( search.editFormId );
		if ( ! Number.isFinite( editFormId ) || editFormId <= 0 ) {
			return;
		}

		return {
			postType: 'jetpack_form',
			postId: String( editFormId ),
		};
	},
};
