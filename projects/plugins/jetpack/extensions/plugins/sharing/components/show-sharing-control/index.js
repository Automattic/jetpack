import { useModuleStatus } from '@automattic/jetpack-shared-extension-utils';
import { ToggleControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore, PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackLikesAndSharingPanel from '../../../../shared/jetpack-likes-and-sharing-panel';
import { SharingPlaceholder } from '../placeholder';
import SharingSkeletonLoader from '../skeleton-loader';

function ShowSharingCheckbox( { checked, onChange } ) {
	return (
		<ToggleControl
			label={ __( 'Show sharing buttons', 'jetpack' ) }
			checked={ checked }
			onChange={ value => {
				onChange( { jetpack_sharing_enabled: value } );
			} }
		/>
	);
}

export default function SharingCheckbox() {
	const { isLoadingModules, isChangingStatus, isModuleActive, changeStatus } =
		useModuleStatus( 'sharedaddy' );

	const isSharingEnabled = useSelect(
		select => select( editorStore ).getEditedPostAttribute( 'jetpack_sharing_enabled' ),
		[]
	);

	const { editPost } = useDispatch( editorStore );

	if ( ! isModuleActive ) {
		return (
			<PostTypeSupportCheck supportKeys="jetpack-sharing-buttons">
				<JetpackLikesAndSharingPanel>
					{ isLoadingModules ? (
						<SharingSkeletonLoader />
					) : (
						<SharingPlaceholder
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
		<PostTypeSupportCheck supportKeys="jetpack-sharing-buttons">
			<JetpackLikesAndSharingPanel>
				<ShowSharingCheckbox checked={ isSharingEnabled } onChange={ editPost } />
			</JetpackLikesAndSharingPanel>
		</PostTypeSupportCheck>
	);
}
