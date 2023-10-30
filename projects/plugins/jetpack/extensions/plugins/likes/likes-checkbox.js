import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { ToggleControl } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch, withSelect } from '@wordpress/data';
import { PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackLikesAndSharingPanel from '../../shared/jetpack-likes-and-sharing-panel';
import { LikesPlaceholder } from './components/placeholder';
import { LikesSkeletonLoader } from './components/skeleton-loader';

const LikesCheckbox = ( { areLikesEnabled, editPost } ) => {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'likes' );

	if ( ! isModuleActive ) {
		return (
			<PostTypeSupportCheck supportKeys="jetpack-post-likes">
				<JetpackLikesAndSharingPanel>
					{ isLoadingModules ? (
						<LikesSkeletonLoader />
					) : (
						<LikesPlaceholder
							changeStatus={ changeStatus }
							isModuleActive={ isModuleActive }
							isLoading={ isChangingStatus }
						/>
					) }
				</JetpackLikesAndSharingPanel>
			</PostTypeSupportCheck>
		);
	}

	return (
		<PostTypeSupportCheck supportKeys="jetpack-post-likes">
			<JetpackLikesAndSharingPanel>
				<ToggleControl
					label={ __( 'Show likes', 'jetpack' ) }
					checked={ areLikesEnabled }
					onChange={ value => {
						editPost( { jetpack_likes_enabled: value } );
					} }
				/>
			</JetpackLikesAndSharingPanel>
		</PostTypeSupportCheck>
	);
};

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
