import {
	TOGGLE_UNIFIED_MODAL,
	SET_UNIFIED_MODAL_INITIAL_PATH,
	SET_UNIFIED_MODAL_SCREEN_LOCK,
	SET_UNIFIED_MODAL_DATA,
} from '../actions/constants';
import {
	toggleUnifiedModal,
	setUnifiedModalInitialPath,
	setUnifiedModalScreenLock,
	setUnifiedModalData,
} from '../actions/unified-modal';
import { SocialStoreState } from '../types';

type Action =
	| ReturnType<
			| typeof toggleUnifiedModal
			| typeof setUnifiedModalInitialPath
			| typeof setUnifiedModalScreenLock
			| typeof setUnifiedModalData
	  >
	| { type: 'default' };

/**
 * Unified modal reducer
 *
 * @param {SocialStoreState['unifiedModal']} state  - State object.
 * @param {Action}                           action - Action object.
 *
 * @return {SocialStoreState['unifiedModal']} - The updated state.
 */
export function unifiedModal(
	state: SocialStoreState[ 'unifiedModal' ] = {},
	action: Action
): SocialStoreState[ 'unifiedModal' ] {
	switch ( action.type ) {
		case TOGGLE_UNIFIED_MODAL:
			return {
				...state,
				isOpen: action.isOpen,
				initialPath: action.initialPath ?? state?.initialPath,
				isScreenLocked: action.isScreenLocked ?? state?.isScreenLocked,
				// Set data when opening, clear it when closing
				data: action.isOpen ? action.data : undefined,
			};

		case SET_UNIFIED_MODAL_INITIAL_PATH:
			return {
				...state,
				initialPath: action.path,
			};

		case SET_UNIFIED_MODAL_SCREEN_LOCK:
			return {
				...state,
				isScreenLocked: action.isLocked,
			};

		case SET_UNIFIED_MODAL_DATA:
			return {
				...state,
				data: {
					...state?.data,
					...action.data,
				},
			};
		default:
			return state;
	}
}
