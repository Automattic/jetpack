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

	return {
		// Data
		data: {
			privacySetting: VIDEO_PRIVACY_LEVELS.indexOf( VIDEO_PRIVACY_LEVEL_PUBLIC ),
			...videoData,
		},

		// Is Fetching
		// @todo: this prop should not be here but in useVideos() hook
		isFetching: useSelect(
			select => ( select( STORE_ID ) as VideopressSelectors ).getIsFetching(),
			[]
		),

		...useSelect(
			select => ( select( STORE_ID ) as VideopressSelectors ).getVideoStateMetadata( id ),
			[]
		),

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
