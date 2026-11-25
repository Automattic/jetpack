// Built as its own module without style loaders, so this imports only the param helpers.
import { LOG_ENTRY_PARAM, entryId } from '../../_inc/data/log-link';

export const route = {
	/**
	 * Show the side panel while `entry` names an email.
	 *
	 * @param props        - The route's state.
	 * @param props.search - The search parameters.
	 * @return Whether to show the inspector.
	 */
	inspector: ( { search }: { search: Record< string, unknown > } ) =>
		entryId( search?.[ LOG_ENTRY_PARAM ] ) !== '',
};
