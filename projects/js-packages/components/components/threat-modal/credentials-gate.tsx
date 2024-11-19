import { Text, Button } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React, { ReactElement } from 'react';
import styles from './styles.module.scss';

const CredentialsGate = ( {
	siteCredentialsNeeded,
	credentialsIsFetching,
	credentialsRedirectUrl,
	children,
}: {
	siteCredentialsNeeded: boolean;
	credentialsIsFetching: boolean;
	credentialsRedirectUrl: string;
	children: ReactElement;
} ): JSX.Element => {
	if ( ! siteCredentialsNeeded ) {
		return children;
	}

	return (
		<>
			<Notice
				status="warning"
				isDismissible={ false }
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
};

export default CredentialsGate;
