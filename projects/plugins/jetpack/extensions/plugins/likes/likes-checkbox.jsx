import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore, PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackLikesAndSharingPanel from '../../shared/jetpack-likes-and-sharing-panel';
import { LikesPlaceholder } from './components/placeholder';
import { LikesSkeletonLoader } from './components/skeleton-loader';

/*
 * This has to stay a plain function component: registerPlugin() requires `render` to be
 * a function, and withSelect() returns a React.memo object, which it silently rejects.
 */
const LikesCheckbox = () => {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'likes' );

	const areLikesEnabled = useSelect(
		select => select( editorStore ).getEditedPostAttribute( 'jetpack_likes_enabled' ),
		[]
	);
	const { editPost } = useDispatch( editorStore );

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
					__nextHasNoMarginBottom={ true }
				/>
			</JetpackLikesAndSharingPanel>
		</PostTypeSupportCheck>
	);
};

export default LikesCheckbox;
