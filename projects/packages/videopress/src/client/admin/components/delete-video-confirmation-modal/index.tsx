/**
 * External dependencies
 */
import { Button, ThemeProvider, Text } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './style.module.scss';

const DeleteVideoConfirmationModal = ( {
	onClose,
	onDelete,
}: {
	onClose: () => void;
	onDelete: () => void;
} ) => {
	return (
		<Modal
			title={ __( 'Delete video', 'jetpack-videopress-pkg' ) }
			onRequestClose={ onClose }
			className={ styles[ 'delete-video-modal' ] }
		>
			<ThemeProvider>
				<div>
					<Text>{ __( 'This action cannot be undone.', 'jetpack-videopress-pkg' ) }</Text>
					<div className={ styles[ 'modal-actions' ] }>
						<Button
							className={ styles[ 'modal-action-button' ] }
							variant="secondary"
							weight="bold"
							onClick={ onClose }
						>
							{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
						</Button>

						<Button
							className={ styles[ 'modal-action-button' ] }
							isDestructive
							variant="primary"
							weight="bold"
							onClick={ onDelete }
						>
							{ __( 'Delete', 'jetpack-videopress-pkg' ) }
						</Button>
					</div>
				</div>
			</ThemeProvider>
		</Modal>
	);
};

export default DeleteVideoConfirmationModal;
