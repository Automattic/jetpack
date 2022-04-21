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
		<AdminPage moduleName={ __( 'Jetpack Promote', 'jetpack-promote' ) }>
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
								{ __( 'The plugin headline.', 'jetpack-promote' ) }
							</h1>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>{ __( 'All the amazing things this plugin does', 'jetpack-promote' ) }</li>
								<li>{ __( 'Presented in a list of amazing features', 'jetpack-promote' ) }</li>
								<li>{ __( 'And all the benefits you will get', 'jetpack-promote' ) }</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<PricingCard
								title={ __( 'Jetpack Promote', 'jetpack-promote' ) }
								priceBefore={ 9 }
								priceAfter={ 4.5 }
								ctaText={ __( 'Get Jetpack Promote', 'jetpack-promote' ) }
								infoText={ __(
									'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
									'jetpack-promote'
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
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackPromoteInitialState;
	return (
		<ConnectScreenRequiredPlan
			buttonLabel={ __( 'Get Jetpack Promote', 'jetpack-promote' ) }
			priceAfter={ 4.5 }
			priceBefore={ 9 }
			pricingTitle={ __( 'Jetpack Promote', 'jetpack-promote' ) }
			title={ __( 'Promote your products and content using ads', 'jetpack-promote' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="jetpack-promote"
			redirectUri="admin.php?page=jetpack-promote"
		>
			<h3>{ __( 'Connection screen title', 'jetpack-promote' ) }</h3>
			<ul>
				<li>{ __( 'Amazing feature 1', 'jetpack-promote' ) }</li>
				<li>{ __( 'Amazing feature 2', 'jetpack-promote' ) }</li>
				<li>{ __( 'Amazing feature 3', 'jetpack-promote' ) }</li>
			</ul>
		</ConnectScreenRequiredPlan>
	);
};
