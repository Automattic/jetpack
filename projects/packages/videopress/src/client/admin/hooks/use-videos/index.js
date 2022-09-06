/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';

/**
 * React custom hook to get the videos.
 *
 * @returns {object} videos
 */
export default function useVideos() {
	return useSelect( select => select( STORE_ID ).getVideos(), [] );
}
