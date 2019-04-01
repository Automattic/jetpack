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

class LikesCheckbox extends Component {
	render() {
		const { areLikesEnabled, toggleLikes } = this.props;
		return (
			<CheckboxControl
				label={ __( 'Show likes.' ) }
				checked={ areLikesEnabled }
				onChange={ value => {
					toggleLikes( value );
				} }
			/>
		);
	}
}

// Fetch the post meta.
const applyWithSelect = withSelect( select => {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const areLikesEnabled = getEditedPostAttribute( 'jetpack_likes_enabled' );

	return { areLikesEnabled };
} );

// Provide method to update post meta.
const applyWithDispatch = withDispatch( dispatch => {
	const { editPost } = dispatch( 'core/editor' );

	return {
		toggleLikes( shouldEnableLiking ) {
			editPost( { jetpack_likes_enabled: shouldEnableLiking } );
		},
	};
} );

// Combine the higher-order components.
export default compose( [ applyWithSelect, applyWithDispatch ] )( LikesCheckbox );
