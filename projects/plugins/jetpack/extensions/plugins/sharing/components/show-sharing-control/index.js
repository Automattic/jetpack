import { CheckboxControl } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore, PostTypeSupportCheck } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import JetpackLikesAndSharingPanel from '../../../../shared/jetpack-likes-and-sharing-panel';

function ShowSharingCheckbox( { checked, onChange } ) {
	return (
		<CheckboxControl
			label={ __( 'Show sharing buttons.', 'jetpack' ) }
			checked={ checked }
			onChange={ value => {
				onChange( { jetpack_sharing_enabled: value } );
			} }
		/>
	);
}

export default function SharingCheckbox() {
	const isSharingEnabled = useSelect(
		select => select( editorStore ).getEditedPostAttribute( 'jetpack_sharing_enabled' ),
		[]
	);

	const { editPost } = useDispatch( editorStore );

	return (
		<PostTypeSupportCheck supportKeys="jetpack-sharing-buttons">
			<JetpackLikesAndSharingPanel>
				<ShowSharingCheckbox checked={ isSharingEnabled } onChange={ editPost } />
			</JetpackLikesAndSharingPanel>
		</PostTypeSupportCheck>
	);
}
