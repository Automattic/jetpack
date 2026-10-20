// Built as its own module without style loaders, so this imports only the param helpers.
import { DEBUG_EVENT_PARAM, entryId } from '../../_inc/data/log-link';

export const route = {
	/**
	 * Show the side panel while `event` names a debug entry.
	 *
	 * @param props        - The route's state.
	 * @param props.search - The search parameters.
	 * @return Whether to show the inspector.
	 */
	inspector: ( { search }: { search: Record< string, unknown > } ) =>
		entryId( search?.[ DEBUG_EVENT_PARAM ] ) !== '',
};
