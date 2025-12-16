import { TOGGLE_SHARE_POST_MODAL, SET_IS_RESHARING } from './constants';

/**
 * Toggles the share post modal.
 *
 * @param isOpen - Whether the modal is open.
 *
 * @return - An action object.
 */
export function toggleSharePostModal( isOpen: boolean ) {
	return {
		type: TOGGLE_SHARE_POST_MODAL,
		isOpen,
	};
}

/**
 * Sets the resharing state.
 *
 * @param isResharing - Whether a reshare is in progress.
 *
 * @return - An action object.
 */
export function setIsResharing( isResharing: boolean ) {
	return {
		type: SET_IS_RESHARING,
		isResharing,
	};
}

/**
 * Opens the share post modal.
 *
 * @return - An action object.
 */
export function openSharePostModal() {
	return toggleSharePostModal( true );
}

/**
 * Closes the share post modal.
 *
 * @return - An action object.
 */
export function closeSharePostModal() {
	return toggleSharePostModal( false );
}
