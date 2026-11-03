// Built as its own module without style loaders, so this imports only the panel's URL state.
import { isSkillPanelOpen } from '../../_inc/client/ai/discover/skill-panel-state';

export const route = {
	/**
	 * Show the side panel while `skill` names a skill that can open on the Discover tab.
	 *
	 * @param props        - The route's state.
	 * @param props.search - The search parameters.
	 * @return Whether to show the inspector.
	 */
	inspector: ( { search }: { search: Record< string, unknown > } ) => isSkillPanelOpen( search ),
};
