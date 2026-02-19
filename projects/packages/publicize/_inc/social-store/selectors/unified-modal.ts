import { SocialStoreState } from '../types';

/**
 * Whether the unified modal is open.
 *
 * @param {SocialStoreState} state - State object.
 *
 * @return Whether the unified modal is open.
 */
export function isUnifiedModalOpen( state: SocialStoreState ) {
	return state.unifiedModal?.isOpen ?? false;
}

/**
 * Gets the initial path for the unified modal.
 *
 * @param {SocialStoreState} state - State object.
 *
 * @return The initial path.
 */
export function getUnifiedModalInitialPath( state: SocialStoreState ) {
	return state.unifiedModal?.initialPath ?? '';
}

/**
 * Whether the unified modal screen is locked.
 *
 * @param {SocialStoreState} state - State object.
 *
 * @return Whether the unified modal screen is locked.
 */
export function isUnifiedModalScreenLocked( state: SocialStoreState ) {
	return state.unifiedModal?.isScreenLocked ?? false;
}

/**
 * Gets the data for the unified modal.
 *
 * @param {SocialStoreState} state - State object.
 *
 * @return The modal data.
 */
export function getUnifiedModalData( state: SocialStoreState ) {
	return state.unifiedModal?.data;
}
