/**
 * External dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import { VIDEO_PRIVACY_LEVELS } from '../../../state/constants';
import { VideopressSelectors, VideoPressVideo } from '../../types';

/**
 * React custom hook to get specific video.
 *
 * @param {number} id - Video ID
 * @returns {object} video
 */
export default function useVideo( id: number | string ) {
	const dispatch = useDispatch( STORE_ID );

	return {
		// Data
		data: useSelect( select => ( select( STORE_ID ) as VideopressSelectors ).getVideo( id ), [
			id,
		] ),

		// Handlers
		setVideo: ( video: VideoPressVideo ) => dispatch.setVideo( video ),

		updateVideoPrivacy: ( level: string ) => {
			dispatch.updateVideoPrivacy(
				id,
				VIDEO_PRIVACY_LEVELS.findIndex( l => l === level )
			);
		},
	};
}
