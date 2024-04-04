import { __ } from '@wordpress/i18n';
import React from 'react';
import BrandedCard from '../branded-card';
import CheckIcon from '../check-icon';
import ConnectionButton from '../connection-button';
import styles from './styles.module.scss';

/**
 * Connection Card component.
 *
 * @returns {React.Component} The `ConnectionCard` component.
 */
export default function ConnectionCard() {
	const { apiNonce, apiRoot, registrationNonce } = window.automatticForAgenciesClientInitialState;
	return (
		<BrandedCard>
			<div className={ styles.card }>
				<h1 className={ styles.card__heading }>
					{ __(
						'Add this site to Automattic for Agencies by connecting now',
						'automattic-for-agencies-client'
					) }
				</h1>
				<ul className={ styles[ 'check-list' ] }>
					<li>
						<CheckIcon />
						{ __( 'See your site in the Sites dashboard', 'automattic-for-agencies-client' ) }
					</li>
					<li>
						<CheckIcon />
						{ __(
							'View any security and performance issues across all of your sites',
							'automattic-for-agencies-client'
						) }
					</li>
					<li>
						<CheckIcon />
						{ __(
							'Update plugins across all sites in a couple of clicks',
							'automattic-for-agencies-client'
						) }
					</li>
					<li>
						<CheckIcon />
						{ __( 'Receive instant downtime alerts', 'automattic-for-agencies-client' ) }
					</li>
					<li>
						<CheckIcon />
						{ __( 'And more', 'automattic-for-agencies-client' ) }
					</li>
				</ul>
				<ConnectionButton
					apiRoot={ apiRoot }
					apiNonce={ apiNonce }
					registrationNonce={ registrationNonce }
					from="automattic-for-agencies-client"
					redirectUri="admin.php?page=automattic-for-agencies-client"
				/>
			</div>
		</BrandedCard>
	);
}
