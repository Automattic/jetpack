/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';

const SharingCheckbox = ( { isSharingEnabled, editPost } ) => (
	<CheckboxControl
		label={ __( 'Show sharing buttons.', 'jetpack' ) }
		checked={ isSharingEnabled }
		onChange={ value => {
			editPost( { jetpack_sharing_enabled: value } );
		} }
	/>
);

// Fetch the post meta.
const applyWithSelect = withSelect( select => {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const isSharingEnabled = getEditedPostAttribute( 'jetpack_sharing_enabled' );

	return { isSharingEnabled };
} );

// Provide method to update post meta.
const applyWithDispatch = withDispatch( dispatch => {
	const { editPost } = dispatch( 'core/editor' );

	return { editPost };
} );

// Combine the higher-order components.
export default compose( [ applyWithSelect, applyWithDispatch ] )( SharingCheckbox );
