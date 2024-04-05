import { TermsOfService } from '@automattic/jetpack-components';
import { ConnectButton } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import React from 'react';
import styles from './styles.module.scss';

/**
 * Connection Button component.
 * Displays a button to connect the site, along with the Terms of Service blurb.
 *
 * @param {object} props           - Component props
 * @param {boolean} props.hideTOS  - Flag to hide the Terms of Service text.
 * @returns {React.Component} The `ConnectionButton` component.
 */
export default function ConnectionButton( { hideTOS = false } ) {
	return (
		<div className={ styles[ 'site-connection' ] }>
			{ ! hideTOS && (
				<div className={ styles[ 'terms-of-service-wrapper' ] }>
					<TermsOfService
						agreeButtonLabel={ __( 'connect this site', 'automattic-for-agencies-client' ) }
						className={ styles[ 'terms-of-service' ] }
					/>
				</div>
			) }
			<div className={ styles[ 'connect-button-wrapper' ] }>
				<ConnectButton
					connectLabel={ __( 'Connect this site', 'automattic-for-agencies-client' ) }
				/>
			</div>
		</div>
	);
}
