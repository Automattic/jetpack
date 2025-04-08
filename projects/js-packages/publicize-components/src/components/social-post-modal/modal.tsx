import {
	getJetpackEditorAction,
	removeJetpackEditorAction,
	useAnalytics,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, Modal, PanelRow } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { store as socialStore } from '../../social-store';
import { PreviewSection } from './preview-section';
import { SettingsSection } from './settings-section';
import styles from './styles.module.scss';

type RenderSocialPostModalProps = {
	title: string;
	onClose: VoidFunction;
};

/**
 * The Social Post Modal component.
 *
 * @param {RenderSocialPostModalProps} props - The component props.
 *
 * @return - Social Post Modal component.
 */
function RenderSocialPostModal( { title, onClose }: RenderSocialPostModalProps ) {
	return (
		<Modal
			onRequestClose={ onClose }
			title={ title }
			className={ styles.modal }
			__experimentalHideHeader
		>
			<div className={ styles[ 'modal-content' ] }>
				<SettingsSection onReShared={ onClose } />
				<PreviewSection />
			</div>
			<Button
				className={ styles[ 'close-button' ] }
				onClick={ onClose }
				icon={ close }
				label={ __( 'Close', 'jetpack-publicize-components' ) }
			/>
		</Modal>
	);
}

/**
 * Share post modal component.
 *
 * @return - React element
 */
export function SocialPostModal() {
	const isModalOpen = useSelect( select => select( socialStore ).isSharePostModalOpen(), [] );
	const { openSharePostModal, closeSharePostModal } = useDispatch( socialStore );
	const { recordEvent } = useAnalytics();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	const handleOpenModal = useCallback( () => {
		if ( ! isModalOpen ) {
			recordEvent( 'jetpack_social_preview_modal_opened' );
		}
		openSharePostModal();
	}, [ isModalOpen, openSharePostModal, recordEvent ] );

	const onClose = useCallback( () => {
		closeSharePostModal();

		if ( getJetpackEditorAction() === 'share_post' ) {
			removeJetpackEditorAction();
		}
	}, [ closeSharePostModal ] );

	return (
		<PanelRow className={ styles.panel }>
			{ isModalOpen ? (
				<RenderSocialPostModal
					onClose={ onClose }
					title={
						isPostPublished
							? _x( 'Share Post', 'The title of the social modal', 'jetpack-publicize-components' )
							: __( 'Social Previews', 'jetpack-publicize-components' )
					}
				/>
			) : null }
			<Button variant="secondary" onClick={ handleOpenModal } className={ styles[ 'open-button' ] }>
				{ isPostPublished
					? _x(
							'Preview & Share',
							'The button label for the modal trigger',
							'jetpack-publicize-components'
					  )
					: __( 'Preview social posts', 'jetpack-publicize-components' ) }
			</Button>
		</PanelRow>
	);
}
