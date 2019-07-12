/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import JetpackLikesAndSharingPanel from '../../shared/jetpack-likes-and-sharing-panel';

const LikesCheckbox = ( { areLikesEnabled, editPost } ) => (
	<PostTypeSupportCheck supportKeys="jetpack-post-likes">
		<JetpackLikesAndSharingPanel>
			<CheckboxControl
				label={ __( 'Show likes.', 'jetpack' ) }
				checked={ areLikesEnabled }
				onChange={ value => {
					editPost( { jetpack_likes_enabled: value } );
				} }
			/>
		</JetpackLikesAndSharingPanel>
	</PostTypeSupportCheck>
);

// Fetch the post meta.
const applyWithSelect = withSelect( select => {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const areLikesEnabled = getEditedPostAttribute( 'jetpack_likes_enabled' );

	return { areLikesEnabled };
} );

// Provide method to update post meta.
const applyWithDispatch = withDispatch( dispatch => {
	const { editPost } = dispatch( 'core/editor' );

	return { editPost };
} );

// Combine the higher-order components.
export default compose( [ applyWithSelect, applyWithDispatch ] )( LikesCheckbox );
