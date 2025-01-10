import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Modal, PanelRow, Button } from '@wordpress/components';
import { useCallback, useReducer } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { PreviewSection } from './preview-section';
import { SettingsSection } from './settings-section';
import styles from './styles.module.scss';

/**
 * The Social Post Modal component.
 *
 * @return {import('react').ReactNode} - Social Post Modal component.
 */
export function SocialPostModal() {
	const [ isModalOpen, toggleModal ] = useReducer( state => ! state, false );
	const { recordEvent } = useAnalytics();

	const handleOpenModal = useCallback( () => {
		if ( ! isModalOpen ) {
			recordEvent( 'jetpack_social_preview_modal_opened' );
		}
		toggleModal();
	}, [ isModalOpen, recordEvent ] );

	return (
		<PanelRow className={ styles.panel }>
			{ isModalOpen && (
				<Modal
					onRequestClose={ toggleModal }
					title={ __( 'Social Previews', 'jetpack-publicize-components' ) }
					className={ styles.modal }
					__experimentalHideHeader
				>
					<div className={ styles[ 'modal-content' ] }>
						<SettingsSection />
						<PreviewSection />
					</div>
					<Button
						className={ styles[ 'close-button' ] }
						onClick={ toggleModal }
						icon={ close }
						label={ __( 'Close', 'jetpack-publicize-components' ) }
					/>
				</Modal>
			) }
			<Button variant="secondary" onClick={ handleOpenModal }>
				{ __( 'Preview social posts', 'jetpack-publicize-components' ) }
			</Button>
		</PanelRow>
	);
}
