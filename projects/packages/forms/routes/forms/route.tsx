/**
 * Internal dependencies
 */
import { getJetpackFormCanvasData } from '../../src/dashboard/wp-build/utils/canvas-editor';
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
	canvas: ( { search }: { search: { editFormId?: number | string } } ) =>
		getJetpackFormCanvasData( search.editFormId ),
};
