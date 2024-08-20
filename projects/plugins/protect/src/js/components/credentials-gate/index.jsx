import { Spinner } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import useCredentialsQuery from '../../data/use-credentials-query';
import CredentialsNeededModal from '../credentials-needed-modal';
import styles from './styles.module.scss';

const CredentialsGate = ( { children } ) => {
	const { data: credentials, isLoading: credentialsIsFetching } = useCredentialsQuery();

	if ( credentialsIsFetching ) {
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

	if ( ! credentials || credentials.length === 0 ) {
		return <CredentialsNeededModal />;
	}

	return children;
};

export default CredentialsGate;
