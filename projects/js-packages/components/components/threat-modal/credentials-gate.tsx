import { Text, Button } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React, { ReactNode } from 'react';
import styles from './styles.module.scss';

const CredentialsGate = ( {
	closeModal,
	credentials,
	credentialsIsFetching,
	credentialsRedirectUrl,
	children,
}: {
	closeModal: () => void;
	credentials: false | Record< string, unknown >[];
	credentialsIsFetching: boolean;
	credentialsRedirectUrl: string;
	children: ReactNode;
} ) => {
	if ( ! credentials || credentials.length === 0 ) {
		return (
			<>
				<Text variant="title-small">{ __( 'Site credentials needed', 'jetpack' ) }</Text>

				<Notice
					status="warning"
					children={
						<Text>
							{ __(
								'Before Jetpack can auto-fix threats on your site, it needs your server credentials.',
								'jetpack'
							) }
						</Text>
					}
				/>

				<Text>
					{ __(
						'Your server credentials allow Jetpack to access the server that’s powering your website. This information is securely saved and only used to perform fix threats detected on your site.',
						'jetpack'
					) }
				</Text>

				<Text>
					{ __(
						'Once you’ve entered server credentials, Jetpack will be fixing the selected threats.',
						'jetpack'
					) }
				</Text>

				<div className={ styles[ 'modal-actions' ] }>
					<Button variant="secondary" onClick={ closeModal }>
						{ __( 'Not now', 'jetpack' ) }
					</Button>
					<Button
						isExternalLink={ true }
						weight="regular"
						href={ credentialsRedirectUrl }
						isLoading={ credentialsIsFetching }
					>
						{ __( 'Enter server credentials', 'jetpack' ) }
					</Button>
				</div>
			</>
		);
	}

	return children;
};

export default CredentialsGate;
