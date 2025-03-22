import { Button, Text, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';
import { useContext, useEffect } from 'react';
import { ThreatsContext, ShieldIcon } from '@automattic/jetpack-scan';
import CancelButton from '../cancel-button.js';
import styles from '../styles.module.scss';

/**
 * Credentials Needed Content
 *
 * @return {JSX.Element} CredentialsNeededContent Component.
 */
export default function CredentialsNeededContent(): JSX.Element {
	const { actionToConfirm, credentials } = useContext( ThreatsContext );

	/**
	 * Poll for the latest credentials status as long as this component is mounted.
	 */
	useEffect( () => {
		credentials?.startPolling?.();

		return () => {
			credentials?.stopPolling?.();
		};
	}, [ credentials ] );

	return (
		<>
			<div className={ styles[ 'threat-modal__content' ] }>
				<div className={ styles[ 'threat-modal__section' ] }>
					<Text className={ styles[ 'threat-modal__section__title' ] }>
						<ShieldIcon variant="warning" height={ 24 } />
						{ _n(
							'Site credentials needed to auto-fix threat',
							'Site credentials needed to auto-fix threats',
							actionToConfirm.items.length,
							'jetpack-scan'
						) }
					</Text>
					<Text>
						{ createInterpolateElement(
							__(
								'To auto-fix this threat, Jetpack needs your website’s SSH, SFTP, or FTP server credentials. <link>Learn more about credentials</link>.',
								'jetpack-scan'
							),
							{
								link: (
									<Button
										href={ getRedirectUrl( 'ssh-sftp-and-ftp-credentials' ) }
										variant="link"
										weight="regular"
										isExternalLink={ true }
										key="learn-more"
									/>
								),
							}
						) }
					</Text>
				</div>
			</div>
			<div className={ styles[ 'threat-modal__footer' ] }>
				<div className={ styles[ 'threat-modal__footer__actions' ] }>
					<CancelButton />
					<Button
						isExternalLink={ true }
						weight="regular"
						href={ credentials.redirectUrl }
						isLoading={ credentials.fetching }
					>
						{ __( 'Enter server credentials', 'jetpack-scan' ) }
					</Button>
				</div>
			</div>
		</>
	);
}
