/**
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import { VideopressSelectors } from '../../types';

/**
 * React custom hook to get specific video.
 *
 * @param {number} id - Video ID
 * @returns {object} video
 */
export default function useVideo( id: number ) {
	return useSelect( select => ( select( STORE_ID ) as VideopressSelectors ).getVideo( id ), [
		id,
	] );
}
