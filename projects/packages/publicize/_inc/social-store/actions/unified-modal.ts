import { UnifiedModalData, UnifiedModalState } from '../types';
import {
	TOGGLE_UNIFIED_MODAL,
	SET_UNIFIED_MODAL_INITIAL_PATH,
	SET_UNIFIED_MODAL_SCREEN_LOCK,
	SET_UNIFIED_MODAL_DATA,
} from './constants';

type ToggleOptions = Omit< UnifiedModalState, 'isOpen' >;

/**
 * Toggles the unified modal.
 *
 * @param {boolean}       isOpen    - Whether the modal is open.
 *
 * @param {ToggleOptions} [options] - Additional options.
 * @return An action object.
 */
export function toggleUnifiedModal( isOpen: boolean, options?: ToggleOptions ) {
	return {
		type: TOGGLE_UNIFIED_MODAL,
		isOpen,
		...options,
	};
}

/**
 * Opens the unified modal.
 *
 * @param {ToggleOptions} [options] - Additional options.
 * @return An action object.
 */
export function openUnifiedModal( options?: ToggleOptions ) {
	return toggleUnifiedModal( true, options );
}

/**
 * Closes the unified modal.
 *
 * @param {ToggleOptions} [options] - Additional options.
 * @return An action object.
 */
export function closeUnifiedModal( options?: ToggleOptions ) {
	return toggleUnifiedModal( false, options );
}

/**
 * Sets the initial path for the unified modal.
 *
 * @param {string} path - The initial path.
 *
 * @return An action object.
 */
export function setUnifiedModalInitialPath( path: string ) {
	return {
		type: SET_UNIFIED_MODAL_INITIAL_PATH,
		path,
	};
}

/**
 * Sets the screen lock for the unified modal.
 *
 * @param {boolean} isLocked - Whether the screen is locked.
 *
 * @return An action object.
 */
export function setUnifiedModalScreenLock( isLocked: boolean ) {
	return {
		type: SET_UNIFIED_MODAL_SCREEN_LOCK,
		isLocked,
	};
}

/**
 * Sets the data for the unified modal.
 *
 * @param {UnifiedModalData} data - The modal data.
 *
 * @return An action object.
 */
export function setUnifiedModalData( data: UnifiedModalData ) {
	return {
		type: SET_UNIFIED_MODAL_DATA,
		data,
	};
}
