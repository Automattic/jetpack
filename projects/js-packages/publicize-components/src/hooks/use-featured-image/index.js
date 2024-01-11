import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Returns the ID of the current featured image if there is one.
 *
 * @returns {number?} The ID of the featured image.
 */
export default () =>
	useSelect( select => select( editorStore ).getEditedPostAttribute( 'featured_media' ) );
