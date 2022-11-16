import { Button, Text } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { STORE_ID } from '../../state/store';
import Notice from '../notice';
import styles from './styles.module.scss';

const UserConnectionNeededModal = () => {
	const { setModal } = useDispatch( STORE_ID );
	const { userIsConnecting, handleConnectUser } = useConnection( {
		redirectUri: 'admin.php?page=jetpack-protect',
	} );

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	return (
		<>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'User connection needed', 'jetpack-protect' ) }
			</Text>

			<Notice
				type="info"
				message={ __(
					'Before Jetpack Protect can ignore and auto-fix threats on your site, a user connection is needed.',
					'jetpack-protect'
				) }
			/>

			<Text mb={ 3 }>
				{ __(
					'A user connection provides Jetpack Protect the access necessary to perform these tasks.',
					'jetpack-protect'
				) }
			</Text>

			<Text mb={ 3 }>
				{ __(
					'Once you’ve secured a user connection, all Jetpack Protect features will be available for use.',
					'jetpack-protect'
				) }
			</Text>

			<div className={ styles.footer }>
				<Button variant="secondary" onClick={ handleCancelClick() }>
					{ __( 'Not now', 'jetpack-protect' ) }
				</Button>
				<Button
					isExternalLink={ true }
					weight="regular"
					isLoading={ userIsConnecting }
					onClick={ handleConnectUser }
				>
					{ __( 'Connect your user account', 'jetpack-protect' ) }
				</Button>
			</div>
		</>
	);
};

export default UserConnectionNeededModal;
