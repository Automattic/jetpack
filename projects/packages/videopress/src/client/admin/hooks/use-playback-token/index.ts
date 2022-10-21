/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state/constants';
import { VideopressSelectors } from '../../types';

/**
 * React custom hook to get the Users.
 *
 * @param {string} guid - The VideoPress video identifier
 * @returns {object} Playback token
 */
export default function usePlaybackToken( guid: string ) {
	// Data
	const playbackToken = useSelect(
		select => ( select( STORE_ID ) as VideopressSelectors ).getPlaybackToken( guid ),
		[ guid ]
	);

	const isFetchingPlaybackToken = useSelect(
		select => ( select( STORE_ID ) as VideopressSelectors ).isFetchingPlaybackToken(),
		[ guid ]
	);

	return {
		playbackToken: playbackToken?.token,
		isFetchingPlaybackToken,
	};
}
