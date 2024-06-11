import { CONNECTION_STORE_ID, ConnectButton } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React, { useMemo } from 'react';
import BrandedCard from '../branded-card';
import CloseCircleIcon from '../close-circle-icon';
import styles from './styles.module.scss';

/**
 * Disconnected Card component.
 *
 * @returns {React.Component} The `ConnectionCard` component.
 */
export default function DisconnectedCard() {
	const { apiNonce, apiRoot, registrationNonce } = window.automatticForAgenciesClientInitialState;

	const connectionErrors = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionErrors(),
		[]
	);

	// Use the highest-level error message.
	const errorMessage = useMemo( () => {
		return Object.values( connectionErrors )?.shift()?.shift()?.error_message;
	}, [ connectionErrors ] );

	return (
		<BrandedCard>
			<div className={ styles.card }>
				<h1>
					{ __(
						'Your site was disconnected from Automattic for Agencies',
						'automattic-for-agencies-client'
					) }
				</h1>
				<p
					className={ clsx(
						styles.connection_status,
						styles[ 'connection_status--disconnected' ]
					) }
				>
					<CloseCircleIcon />
					{ errorMessage || __( 'Site is disconnected', 'automattic-for-agencies-client' ) }
				</p>
				<div className={ styles[ 'site-connection' ] }>
					<div className={ styles[ 'connect-button-wrapper' ] }>
						<ConnectButton
							connectLabel={ __( 'Reconnect this site now', 'automattic-for-agencies-client' ) }
							apiRoot={ apiRoot }
							apiNonce={ apiNonce }
							registrationNonce={ registrationNonce }
							from="automattic-for-agencies-client"
							redirectUri="options-general.php?page=automattic-for-agencies-client"
						/>
					</div>
				</div>
			</div>
		</BrandedCard>
	);
}
