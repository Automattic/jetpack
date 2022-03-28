/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	PricingCard,
} from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { ConnectScreenRequiredPlan, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import React from 'react';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const Admin = () => {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	return (
		<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) }>
			<AdminSectionHero>
				{ showConnectionCard ? (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<ConnectionSection />
						</Col>
					</Container>
				) : (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 6 } lg={ 6 }>
							<h1 className={ styles.heading }>
								{ __(
									'Security tools that keep your site safe and sound, from posts to plugins.',
									'jetpack-protect'
								) }
							</h1>
							<h3>{ __( 'Jetpack’s security features include', 'jetpack-protect' ) }</h3>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>{ __( 'Brute Force Attack Protection', 'jetpack-protect' ) }</li>
								<li>
									{ __( 'Scan for known plugin & theme vulnerabilities', 'jetpack-protect' ) }
								</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<PricingCard
								title={ __( 'Jetpack Security', 'jetpack-protect' ) }
								priceBefore={ 24.95 }
								priceAfter={ 8.95 }
								ctaText={ __( 'Get Jetpack Security', 'jetpack-protect' ) }
								infoText={ __(
									'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
									'jetpack-protect'
								) }
							/>
						</Col>
					</Container>
				) }
			</AdminSectionHero>
		</AdminPage>
	);
};

export default Admin;

const ConnectionSection = () => {
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackProtectInitialState;
	return (
		<ConnectScreenRequiredPlan
			buttonLabel={ __( 'Get Jetpack Security', 'jetpack-protect' ) }
			priceBefore={ 24.95 }
			priceAfter={ 8.95 }
			pricingTitle={ __( 'Jetpack Security', 'jetpack-protect' ) }
			title={ __(
				'Security tools that keep your site safe and sound, from posts to plugins.',
				'jetpack-protect'
			) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="jetpack-protect"
			redirectUri="admin.php?page=jetpack-protect"
		>
			<h3>{ __( 'Jetpack’s security features include', 'jetpack-protect' ) }</h3>
			<ul>
				<li>{ __( 'Brute Force Attack Protection', 'jetpack-protect' ) }</li>
				<li>{ __( 'Scan for known plugin & theme vulnerabilities', 'jetpack-protect' ) }</li>
			</ul>
		</ConnectScreenRequiredPlan>
	);
};
