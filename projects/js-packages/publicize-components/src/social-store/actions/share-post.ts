import { TOGGLE_SHARE_POST_MODAL } from './constants';

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
