
/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function MediaButtonMenu( props ) {
	const { mediaProps, open, isFeatured } = props;
	const originalComponent = mediaProps.render;

	if ( isFeatured && mediaProps.value === undefined ) {
		return originalComponent( { open } );
	}

	return (
		<Button
			className="jetpack-external-media-browse-button"
			isTertiary={ ! isFeatured }
			isPrimary={ isFeatured }
		>
			{ __( 'Select Image', 'jetpack' ) }
		</Button>
	);
}

export default MediaButtonMenu;
