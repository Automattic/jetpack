/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import {
	STORE_ID,
	VIDEO_PRIVACY_LEVELS,
	VIDEO_PRIVACY_LEVEL_PRIVATE,
} from '../../../state/constants';
import { VideopressSelectors, VideoPressVideo } from '../../types';

/**
 * React custom hook to get the Users.
 *
 * @param {VideoPressVideo} video - The VideoPress video
 * @returns {object} Playback token
 */
export default function usePlaybackToken( video: VideoPressVideo ) {
	const videoNeedsPlaybackToken = video.privacySetting
		? VIDEO_PRIVACY_LEVELS[ video.privacySetting ] === VIDEO_PRIVACY_LEVEL_PRIVATE
		: false;

	// Data
	const playbackToken = useSelect(
		select => {
			if ( videoNeedsPlaybackToken ) {
				return ( select( STORE_ID ) as VideopressSelectors ).getPlaybackToken( video.guid );
			}
			return null;
		},
		[ video.guid ]
	);

	const isFetchingPlaybackToken = useSelect(
		select => {
			if ( videoNeedsPlaybackToken ) {
				return ( select( STORE_ID ) as VideopressSelectors ).isFetchingPlaybackToken();
			}
			return false;
		},
		[ video.guid ]
	);

	return {
		playbackToken: playbackToken?.token,
		isFetchingPlaybackToken,
	};
}
