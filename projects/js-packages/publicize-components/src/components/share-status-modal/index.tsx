import { Button, Modal } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useReducer } from 'react';
import { store as socialStore } from '../../social-store';
import { ShareList } from './share-list';
import styles from './styles.module.scss';

/**
 * Share status modal component.
 *
 * @return {import('react').ReactNode} - Share status modal component.
 */
export function ShareStatusModal() {
	const [ isModalOpen, toggleModal ] = useReducer( state => ! state, false );

	const handleOpenModal = useCallback( () => {
		toggleModal();
	}, [] );

	const { featureFlags } = useSelect( select => {
		const store = select( socialStore );
		return {
			featureFlags: store.featureFlags(),
		};
	}, [] );

	if ( ! featureFlags.useShareStatus ) {
		return null;
	}

	return (
		<div className={ styles.wrapper }>
			{ isModalOpen && (
				<Modal
					onRequestClose={ toggleModal }
					title={ __( 'Sharing status', 'jetpack' ) }
					className={ styles.modal }
				>
					<ShareList />
					<Button
						className={ styles[ 'close-button' ] }
						onClick={ toggleModal }
						icon={ close }
						label={ __( 'Close', 'jetpack' ) }
					/>
				</Modal>
			) }
			<Button variant="secondary" onClick={ handleOpenModal }>
				{ __( 'Review sharing status', 'jetpack' ) }
			</Button>
		</div>
	);
}
