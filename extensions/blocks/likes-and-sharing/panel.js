/**
 * External dependencies
 */
import { CheckboxControl, PanelBody } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { get } from 'lodash';
import { withDispatch, withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import getJetpackData from '../../utils/get-jetpack-data';
import { __ } from '../../utils/i18n';

class LikesAndSharingPanel extends Component {
	render() {
		const { areLikesEnabled, isSharingEnabled, toggleLikes, toggleSharing } = this.props;

		const data = getJetpackData();
		const postHasLikes = get( data, 'hasLikes', false );
		const postHasSharing = get( data, 'hasSharing', false );

		return (
			<PanelBody title={ __( 'Likes and Sharing' ) }>
				{ postHasLikes && (
					<CheckboxControl
						label={ __( 'Show likes.' ) }
						checked={ areLikesEnabled }
						onChange={ value => {
							toggleLikes( value );
						} }
					/>
				) }

				{ postHasSharing && (
					<CheckboxControl
						label={ __( 'Show sharing buttons.' ) }
						checked={ isSharingEnabled }
						onChange={ value => {
							toggleSharing( value );
						} }
					/>
				) }
			</PanelBody>
		);
	}
}

// Fetch the post meta.
const applyWithSelect = withSelect( select => {
	const { getEditedPostAttribute } = select( 'core/editor' );
	const areLikesEnabled = getEditedPostAttribute( 'jetpack_likes_enabled' );
	const isSharingEnabled = getEditedPostAttribute( 'jetpack_sharing_enabled' );

	return {
		areLikesEnabled,
		isSharingEnabled,
	};
} );

// Provide method to update post meta.
const applyWithDispatch = withDispatch( dispatch => {
	const { editPost } = dispatch( 'core/editor' );

	return {
		toggleLikes( shouldEnableLiking ) {
			editPost( { jetpack_likes_enabled: shouldEnableLiking } );
		},
		toggleSharing( shouldEnableSharing ) {
			editPost( { jetpack_sharing_enabled: shouldEnableSharing } );
		},
	};
} );

// Combine the higher-order components.
export default compose( [ applyWithSelect, applyWithDispatch ] )( LikesAndSharingPanel );
