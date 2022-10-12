import { Button, Text } from '@automattic/jetpack-components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_ID } from '../../state/store';
import styles from './styles.module.scss';

const ScanModal = () => {
	const { setModal, scan } = useDispatch( STORE_ID );
	// const threatsUpdating = useSelect( select => select( STORE_ID ).getThreatsUpdating() );

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const handleScanClick = () => {
		return async event => {
			event.preventDefault();
			scan( () => {
				setModal( { type: null } );
			} );
		};
	};

	return (
		<>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'Do you really want to scan now?', 'jetpack-protect' ) }
			</Text>
			<div className={ styles.footer }>
				<Button variant="secondary" onClick={ handleCancelClick() }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				<Button
					isDestructive={ true }
					// isLoading={ Boolean( threatsUpdating && threatsUpdating[ id ] ) }
					onClick={ handleScanClick() }
				>
					{ __( 'Scan now', 'jetpack-protect' ) }
				</Button>
			</div>
		</>
	);
};

export default ScanModal;
