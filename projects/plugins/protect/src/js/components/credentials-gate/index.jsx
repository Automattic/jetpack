import { Spinner } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_ID } from '../../state/store';
import CredentialsNeededModal from '../credentials-needed-modal';
import styles from './styles.module.scss';

const CredentialsGate = ( { children } ) => {
	const { checkCredentialsState } = useDispatch( STORE_ID );

	const { credentialState, credentialStateIsFetching } = useSelect( select => ( {
		credentialState: select( STORE_ID ).getCredentialState(),
		credentialStateIsFetching: select( STORE_ID ).getCredentialStateIsFetching(),
	} ) );

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

	return children;
};

export default CredentialsGate;
