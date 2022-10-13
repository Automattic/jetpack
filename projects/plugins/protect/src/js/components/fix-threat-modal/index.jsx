import { Button, Text } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_ID } from '../../state/store';
import ThreatFixHeader from '../threat-fix-header';
import styles from './styles.module.scss';

const FixThreatModal = ( { id, fixable, label, icon, severity } ) => {
	const { setModal, fixThreats } = useDispatch( STORE_ID );
	const threatsUpdating = useSelect( select => select( STORE_ID ).getThreatsUpdating() );

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const handleFixClick = () => {
		return async event => {
			event.preventDefault();
			fixThreats( [ id ], () => {
				setModal( { type: null } );
			} );
		};
	};

	return (
		<>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'Fix Threat', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 3 }>
				{ __( 'Jetpack will be fixing the selected threat:', 'jetpack-protect' ) }
			</Text>

			<div className={ styles.list }>
				<ThreatFixHeader threat={ { id, fixable, label, icon, severity } } fixAllDialog={ false } />
			</div>

			<div className={ styles.footer }>
				<Button variant="secondary" onClick={ handleCancelClick() }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				<Button
					isLoading={ Boolean( threatsUpdating && threatsUpdating[ id ] ) }
					onClick={ handleFixClick() }
				>
					{ __( 'Fix threat', 'jetpack-protect' ) }
				</Button>
			</div>
		</>
	);
};

export default FixThreatModal;
