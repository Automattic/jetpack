import { Text, Button } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import React, { ReactElement, useContext } from 'react';
import styles from './styles.module.scss';
import { ThreatModalContext } from '.';

/**
 * CredentialsGate component
 *
 * @param {object}       props                        - The component props.
 * @param {boolean}      props.siteCredentialsNeeded  - Whether the credentials exist.
 * @param {boolean}      props.credentialsIsFetching  - Whether the credentials are being fetched.
 * @param {string}       props.credentialsRedirectUrl - The URL to redirect the user to set credentials.
 * @param {ReactElement} props.children               - The child components to render if credentials are set.
 *
 * @return {JSX.Element} The rendered CredentialsGate component.
 */
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
	const { showThreatDetails, onShowThreatDetailsClick } = useContext( ThreatModalContext );

	if ( ! siteCredentialsNeeded ) {
		return children;
	}

	return (
		<>
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
				{ ! showThreatDetails && (
					<Button variant="secondary" onClick={ onShowThreatDetailsClick }>
						{ __( 'Threat Details', 'jetpack' ) }
					</Button>
				) }
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
