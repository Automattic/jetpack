import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import useMediaRestrictions from '../use-media-restrictions';
/**
 * Returns whether the featured image is valid or not.
 *
 * @param {Array} connections - The list of connections to validate the featured image against.
 * @returns {{isFeaturedImageValid: boolean, validationError: string}} Whether the featured image is valid or not and the validation error.
 */
export default function useValidateFeaturedImage( connections ) {
	const { getMedia } = useSelect( select => select( 'core' ) );
	const featuredImage = useSelect( select =>
		select( editorStore ).getEditedPostAttribute( 'featured_media' )
	);
	const { getValidationError } = useMediaRestrictions( connections );

	const validationError = getValidationError( {
		mime: getMedia( featuredImage )?.mime_type,
		fileSize: getMedia( featuredImage )?.media_details?.filesize,
	} );

	return { isFeaturedImageValid: featuredImage !== 0 && ! validationError, validationError };
}
