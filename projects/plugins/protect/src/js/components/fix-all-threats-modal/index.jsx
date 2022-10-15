import { Button, Spinner, Text } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { STORE_ID } from '../../state/store';
import CredentialsNeededModal from '../credentials-needed-modal';
import ThreatFixHeader from '../threat-fix-header';
import styles from './styles.module.scss';

const FixAllThreatsModal = ( { threatList = [] } ) => {
	const { checkCredentialsState, setModal, fixThreats } = useDispatch( STORE_ID );

	const { credentialState, credentialStateIsFetching, threatsUpdating } = useSelect( select => ( {
		credentialState: select( STORE_ID ).getCredentialState(),
		credentialStateIsFetching: select( STORE_ID ).getCredentialStateIsFetching(),
		threatsUpdating: select( STORE_ID ).getThreatsUpdating(),
	} ) );

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

	if ( ! credentialState.state && ! credentialStateIsFetching ) {
		checkCredentialsState();
	}

	if ( ! credentialState.state ) {
		return (
			<div className={ styles.loading }>
				<Spinner
					color="black"
					style={ {
						color: 'black',
						marginTop: 0,
						marginLeft: 0,
					} }
				/>
				<p className={ styles.loading__message }>
					{ __( 'Checking credentials…', 'jetpack-protect' ) }
				</p>
			</div>
		);
	}

	if ( 'awaiting_credentials' === credentialState.state ) {
		return <CredentialsNeededModal />;
	}

	return (
		<>
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
		</>
	);
};

export default FixAllThreatsModal;
