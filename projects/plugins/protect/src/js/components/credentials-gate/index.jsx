import { Spinner } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_ID } from '../../state/store';
import CredentialsNeededModal from '../credentials-needed-modal';
import styles from './styles.module.scss';

const CredentialsGate = ( { children } ) => {
	const { checkCredentials } = useDispatch( STORE_ID );

	const { credential, CredentialIsFetching } = useSelect( select => ( {
		Credential: select( STORE_ID ).getCredential(),
		CredentialIsFetching: select( STORE_ID ).getCredentialIsFetching(),
	} ) );

	if ( ! credential.credentials && ! CredentialIsFetching ) {
		checkCredentials();
	}

	if ( ! credential.credentials ) {
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

	if ( credential.credentials.length === 0 ) {
		return <CredentialsNeededModal />;
	}

	return children;
};

export default CredentialsGate;
