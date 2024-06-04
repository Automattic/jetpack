import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import BrandedCard from '../branded-card';
import CheckCircleIcon from '../check-circle-icon';
import styles from './styles.module.scss';

/**
 * Connected Card component.
 *
 * @returns {React.Component} The `ConnectionCard` component.
 */
export default function ConnectedCard() {
	const navigateToDashboard = useCallback( () => {
		const currentUrl = encodeURIComponent( window.location.href );
		window.location.href = `https://agencies.automattic.com?source=client-plugin&wp-admin-url=${ currentUrl }`;
	}, [] );

	return (
		<BrandedCard>
			<div className={ styles.card }>
				<h1>
					{ __(
						'Your site is connected to Automattic for Agencies',
						'automattic-for-agencies-client'
					) }
				</h1>
				<p className={ clsx( styles.connection_status, styles[ 'connection_status--connected' ] ) }>
					<CheckCircleIcon />
					{ __( 'Site is connected and syncing', 'automattic-for-agencies-client' ) }
				</p>
				<div>
					<Button onClick={ navigateToDashboard } isExternalLink>
						{ __( 'Visit the dashboard', 'automattic-for-agencies-client' ) }
					</Button>
				</div>
			</div>
		</BrandedCard>
	);
}
