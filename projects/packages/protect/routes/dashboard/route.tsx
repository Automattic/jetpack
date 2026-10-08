// route.js is built without style loaders, so this reads the params, not the sections themselves.
import { INSPECTOR_PARAMS } from './sections/inspector-params';

export const route = {
	/**
	 * Show the inspector while a section's inspector param is in the URL.
	 *
	 * @param props        - The route's state.
	 * @param props.search - The search parameters.
	 * @return Whether to show the inspector.
	 */
	inspector: ( { search }: { search: Record< string, unknown > } ) =>
		INSPECTOR_PARAMS.some( param => search?.[ param ] ),
};
