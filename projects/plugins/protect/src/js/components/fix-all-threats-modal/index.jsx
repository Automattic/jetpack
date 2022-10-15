import { Button, Text } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { STORE_ID } from '../../state/store';
import CredentialsGate from '../credentials-gate';
import ThreatFixHeader from '../threat-fix-header';
import styles from './styles.module.scss';

const FixAllThreatsModal = ( { threatList = [] } ) => {
	const { setModal, fixThreats } = useDispatch( STORE_ID );
	const { threatsUpdating } = useSelect( select => select( STORE_ID ).getThreatsUpdating() );

	const [ threatIds, setThreatIds ] = useState( threatList.map( ( { id } ) => id ) );

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	const handleFixClick = () => {
		return async event => {
			event.preventDefault();
			fixThreats( threatIds, () => {
				setModal( { type: null } );
			} );
		};
	};

	const handleCheckboxClick = useCallback(
		( checked, threat ) => {
			if ( ! checked ) {
				setThreatIds( threatIds.filter( id => id !== threat.id ) );
			} else {
				setThreatIds( threatIds.push( threat.id ) );
			}
		},
		[ threatIds ]
	);

	return (
		<CredentialsGate>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'Fix all threats', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 3 }>
				{ __( 'Jetpack will be fixing the selected threats:', 'jetpack-protect' ) }
			</Text>

			<div className={ styles.list }>
				{ threatList.map( threat => (
					<ThreatFixHeader
						threat={ threat }
						fixAllDialog={ true }
						onCheckFix={ handleCheckboxClick }
					/>
				) ) }
			</div>

			<div className={ styles.footer }>
				<Button variant="secondary" onClick={ handleCancelClick() }>
					{ __( 'Cancel', 'jetpack-protect' ) }
				</Button>
				<Button
					isLoading={ Boolean( threatsUpdating ) && threatsUpdating[ threatIds[ 0 ] ] }
					onClick={ handleFixClick() }
				>
					{ __( 'Fix all threats', 'jetpack-protect' ) }
				</Button>
			</div>
		</CredentialsGate>
	);
};

export default FixAllThreatsModal;
