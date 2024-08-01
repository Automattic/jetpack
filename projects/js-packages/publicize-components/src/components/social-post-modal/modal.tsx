import { Modal, PanelRow, Button } from '@wordpress/components';
import { useReducer } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
				>
					Something here
				</Modal>
			) }
			<Button variant="secondary" onClick={ toggleModal }>
				{ __( 'Create custom posts', 'jetpack' ) }
			</Button>
		</PanelRow>
	);
}
