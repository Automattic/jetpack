import { Button, Text, getRedirectUrl } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import { STORE_ID } from '../../state/store';
import Notice from '../notice';
import styles from './styles.module.scss';

const CredentialsNeededModal = () => {
	const { setModal } = useDispatch( STORE_ID );
	const { siteSuffix } = window.jetpackProtectInitialState;

	const { checkCredentialsState } = useDispatch( STORE_ID );
	const credentialState = useSelect( select => select( STORE_ID ).getCredentialState() );

	const handleCancelClick = () => {
		return event => {
			event.preventDefault();
			setModal( { type: null } );
		};
	};

	/**
	 * Poll credentials as long as the modal is open.
	 */
	useEffect( () => {
		const interval = setInterval( () => {
			if (
				! credentialState.state ||
				[ 'awaiting_credentials', 'unavailable' ].indexOf( credentialState.state ) >= 0
			) {
				checkCredentialsState();
			}
		}, 3000 );

		return () => clearInterval( interval );
	}, [ checkCredentialsState, credentialState.state ] );

	return (
		<>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'Site credentials needed', 'jetpack-protect' ) }
			</Text>

			<Notice
				type="info"
				message={ __(
					'Before Jetpack Protect can auto-fix threats on your site, it needs your server credentials.',
					'jetpack-protect'
				) }
			/>

			<Text mb={ 3 }>
				{ __(
					'Your server credentials allow Jetpack Protect to access the server that’s powering your website. This information is securely saved and only used to perform fix threats detected on your site.',
					'jetpack-protect'
				) }
			</Text>

			<Text mb={ 3 }>
				{ __(
					'Once you’ve entered server credentials, Jetpack Protect will be fixing the selected threats.',
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
					href={ getRedirectUrl( 'jetpack-settings-security-credentials', { site: siteSuffix } ) }
				>
					{ __( 'Enter server credentials', 'jetpack-protect' ) }
				</Button>
			</div>
		</>
	);
};

export default CredentialsNeededModal;
