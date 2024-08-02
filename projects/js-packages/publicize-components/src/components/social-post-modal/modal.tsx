import { Modal, PanelRow, Button } from '@wordpress/components';
import { useReducer } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { PreviewSection } from './preview-section';
import { SettingsSection } from './settings-section';
import styles from './styles.module.scss';

/**
 * The Social Post Modal component.
 *
 * @returns {import('react').ReactNode} - Social Post Modal component.
 */
export function SocialPostModal() {
	const [ isModalOpen, toggleModal ] = useReducer( state => ! state, false );

	return (
		<PanelRow className={ styles.panel }>
			{ isModalOpen && (
				<Modal
					onRequestClose={ toggleModal }
					title={ __( 'Social Previews', 'jetpack' ) }
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
						label={ __( 'Close', 'jetpack' ) }
					/>
				</Modal>
			) }
			<Button variant="secondary" onClick={ toggleModal }>
				{ __( 'Preview social posts', 'jetpack' ) }
			</Button>
		</PanelRow>
	);
}
