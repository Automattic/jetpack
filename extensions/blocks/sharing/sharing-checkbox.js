/**
 * External dependencies
 */
import { CheckboxControl } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { __ } from '../../utils/i18n';

class SharingCheckbox extends Component {
	render() {
		const { isSharingEnabled, toggleSharing } = this.props;

		return (
			<CheckboxControl
				label={ __( 'Show sharing buttons.' ) }
				checked={ isSharingEnabled }
				onChange={ value => {
					toggleSharing( value );
				} }
			/>
		);
	}
}

// Fetch the post meta.
const applyWithSelect = withSelect( select => {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const isSharingEnabled = getEditedPostAttribute( 'jetpack_sharing_enabled' );

	return { isSharingEnabled };
} );

// Provide method to update post meta.
const applyWithDispatch = withDispatch( dispatch => {
	const { editPost } = dispatch( 'core/editor' );

	return {
		toggleSharing( shouldEnableSharing ) {
			editPost( { jetpack_sharing_enabled: shouldEnableSharing } );
		},
	};
} );

// Combine the higher-order components.
export default compose( [ applyWithSelect, applyWithDispatch ] )( SharingCheckbox );
