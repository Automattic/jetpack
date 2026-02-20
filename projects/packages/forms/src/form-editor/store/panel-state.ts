/**
 * Small data store to manage which inspector panel should be opened.
 * This allows the pre-publish panel to communicate with the block's edit component.
 */
import { createReduxStore, register } from '@wordpress/data';

export const PANEL_STATE_STORE = 'jetpack-forms/panel-state';

export type PanelName = 'action-after-submit' | 'form-notifications' | 'responses-storage' | null;

type State = {
	activePanel: PanelName;
};

const DEFAULT_STATE: State = {
	activePanel: null,
};

const actions = {
	openPanel( panelName: PanelName ) {
		return {
			type: 'OPEN_PANEL' as const,
			panelName,
		};
	},
	closePanel() {
		return {
			type: 'CLOSE_PANEL' as const,
		};
	},
};

const selectors = {
	getActivePanel( state: State ): PanelName {
		return state.activePanel;
	},
};

const reducer = (
	state: State = DEFAULT_STATE,
	action: ReturnType< typeof actions.openPanel > | ReturnType< typeof actions.closePanel >
): State => {
	switch ( action.type ) {
		case 'OPEN_PANEL':
			return { ...state, activePanel: action.panelName };
		case 'CLOSE_PANEL':
			return { ...state, activePanel: null };
		default:
			return state;
	}
};

const store = createReduxStore( PANEL_STATE_STORE, {
	reducer,
	actions,
	selectors,
} );

register( store );

export { store, actions, selectors, reducer, DEFAULT_STATE };
