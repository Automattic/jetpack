import { store as editorStore } from '@wordpress/editor';
import { PostShareStatus, SocialStoreState } from '../types';
import {
	FETCH_POST_SHARE_STATUS,
	POLLING_FOR_POST_SHARE_STATUS,
	RECEIVE_POST_SHARE_STATUS,
	TOGGLE_SHARE_STATUS_MODAL,
} from './constants';

/**
 * Returns an action object used in signalling that the post share status
 * has been requested and is loading.
 *
 * @param {number}  postId    - Post ID.
 * @param {boolean} [loading] - Loading status.
 * @return {object} Action object.
 */
export function fetchPostShareStatus( postId: number, loading = true ) {
	return {
		type: FETCH_POST_SHARE_STATUS,
		postId,
		loading,
	};
}

/**
 * Returns an action object used in signalling that the post share status has been received.
 *
 * @param {SocialStoreState[ 'shareStaus' ][ number ]} shareStatus - Post share status.
 * @param {number}                                     postId      - Post ID.
 *
 * @return {object} Action object.
 */
export function receivePostShareStaus(
	shareStatus: SocialStoreState[ 'shareStatus' ][ number ],
	postId: number
) {
	return {
		type: RECEIVE_POST_SHARE_STATUS,
		shareStatus,
		postId,
	};
}

/**
 * Toggles the share status modal.
 *
 * @param {boolean} isOpen - Whether the modal is open.
 *
 * @return {object} - An action object.
 */
export function toggleShareStatusModal( isOpen: boolean ) {
	return {
		type: TOGGLE_SHARE_STATUS_MODAL,
		isOpen,
	};
}

/**
 * Opens the share status modal.
 *
 * @return {object} - An action object.
 */
export function openShareStatusModal() {
	return toggleShareStatusModal( true );
}

/**
 * Closes the share status modal.
 * @return {object} - An action object.
 */
export function closeShareStatusModal() {
	return toggleShareStatusModal( false );
}

type IsRequestComplete = ( options: {
	lastTimestamp: number;
	postShareStatus: PostShareStatus;
} ) => boolean;

/**
 * Default implementation to check if the request is complete.
 *
 * @param {IsRequestComplete} options - Options.
 *
 * @return {boolean} - Whether the request is complete.
 */
export const defaultIsRequestComplete: IsRequestComplete = ( {
	lastTimestamp,
	postShareStatus,
} ) => {
	// If the last timestamp is present, check if there are newer timestamps.
	// otherwise check if we have any shares.
	return lastTimestamp
		? postShareStatus.shares.some( share => share.timestamp > lastTimestamp )
		: postShareStatus.shares.length > 0;
};

type PollForPostShareStatusOptions = {
	postId?: number;
	timeout?: number;
	isRequestComplete?: IsRequestComplete;
	pollingInterval?: number;
};

const ONE_MINUTE_IN_MS = 60 * 1000;

const POLLING_INTERVAL = 3 * 1000; // milliseconds

/**
 * Returns an action object used in signalling that polling for post share status
 * is in progress.
 *
 * @param {number}  postId    - Post ID.
 * @param {boolean} [polling] - Polling status.
 * @return {object} Action object.
 */
export function pollingForPostShareStatus( postId: number, polling = true ) {
	return {
		type: POLLING_FOR_POST_SHARE_STATUS,
		postId,
		polling,
	};
}

/**
 * Poll for share status.
 *
 * @param {PollForPostShareStatusOptions} options - Options.
 *
 * @return {Promise<void>} - Function to start polling.
 */
export function pollForPostShareStatus( {
	pollingInterval = POLLING_INTERVAL,
	postId: _postId,
	isRequestComplete = defaultIsRequestComplete,
	timeout = ONE_MINUTE_IN_MS,
}: PollForPostShareStatusOptions = {} ) {
	return async function ( { dispatch, select, registry } ) {
		const startedAt = Date.now();

		const postId = _postId || registry.select( editorStore ).getCurrentPostId();

		const lastTimestamp = select.getPostShareStatus( postId ).shares[ 0 ]?.timestamp || 0;

		let isTheRequestComplete = false;
		let hasTimeoutPassed = false;

		dispatch( pollingForPostShareStatus( postId ) );

		do {
			// Do not invalidate the resolution if the request is still loading.
			if ( ! select.getPostShareStatus( postId ).loading ) {
				// Invalidate the resolution to get the latest share status.
				dispatch.invalidateResolution( 'getPostShareStatus', [ postId ] );
			}

			// Wait for the polling interval.
			await new Promise( resolve => setTimeout( resolve, pollingInterval ) );

			isTheRequestComplete = isRequestComplete( {
				lastTimestamp,
				postShareStatus: select.getPostShareStatus( postId ),
			} );

			hasTimeoutPassed = Date.now() - startedAt > timeout;
		} while ( ! isTheRequestComplete && ! hasTimeoutPassed );

		dispatch( pollingForPostShareStatus( postId, false ) );
	};
}
