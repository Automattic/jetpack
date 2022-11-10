/**
 * External dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import { VIDEO_PRIVACY_LEVELS, VIDEO_PRIVACY_LEVEL_PUBLIC } from '../../../state/constants';
import { VideopressSelectors, VideoPressVideo } from '../../types';

/**
 * React custom hook to get specific video.
 *
 * @param {number} id - Video ID
 * @returns {object} video
 */
export default function useVideo( id: number | string ) {
	const dispatch = useDispatch( STORE_ID );

	const videoData = useSelect(
		select => ( select( STORE_ID ) as VideopressSelectors ).getVideo( id ),
		[ id ]
	);

	const metadata = useSelect(
		select => ( select( STORE_ID ) as VideopressSelectors ).getVideoStateMetadata( id ),
		[ id ]
	);

	// Is Fetching
	// @todo: this prop should not be here but in useVideos() hook
	const isFetching = useSelect(
		select => ( select( STORE_ID ) as VideopressSelectors ).getIsFetching(),
		[ id ]
	);

	const processing = videoData?.posterImage === null && ! videoData?.finished; // Video is processing if it has no poster image and it's not finished.

	return {
		// Data
		data: {
			privacySetting: VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_PUBLIC ) as 0 | 1 | 2,
			...videoData,
		},

		// Video Meta Data
		...metadata,

		processing,

		isFetching,

		// Handlers
		setVideo: ( video: VideoPressVideo ) => dispatch.setVideo( video ),

		deleteVideo: () => dispatch.deleteVideo( id ),

		updateVideoPrivacy: ( level: string ) => {
			dispatch.updateVideoPrivacy(
				id,
				VIDEO_PRIVACY_LEVELS.findIndex( l => l === level )
			);
		},
	};
}
