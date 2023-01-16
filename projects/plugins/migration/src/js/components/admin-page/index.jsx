import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	PricingCard,
} from '@automattic/jetpack-components';
import { ConnectScreen, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React from 'react';
import connectImage from '../../../../images/connect.png';
import styles from './styles.module.scss';

const Admin = () => {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;

	return (
		<AdminPage
			moduleName={ __( `Move to WordPress.com`, 'jetpack-migration' ) }
			showBackground={ false }
			header={ <></> }
		>
			<AdminSectionHero>
				{ showConnectionCard ? (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<ConnectionSection />
						</Col>
					</Container>
				) : (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col>
							<div id="jp-admin-notices" className="jetpack-migration-jitm-card" />
						</Col>
						<Col sm={ 4 } md={ 6 } lg={ 6 }>
							<h1 className={ styles.heading }>
								{ __( 'The plugin headline.', 'jetpack-migration' ) }
							</h1>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>{ __( 'All the amazing things this plugin does', 'jetpack-migration' ) }</li>
								<li>{ __( 'Presented in a list of amazing features', 'jetpack-migration' ) }</li>
								<li>{ __( 'And all the benefits you will get', 'jetpack-migration' ) }</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<PricingCard
								title={ __( 'Jetpack Migration', 'jetpack-migration' ) }
								priceBefore={ 9 }
								priceAfter={ 4.5 }
								ctaText={ __( 'Get Jetpack Migration', 'jetpack-migration' ) }
								infoText={ __(
									'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
									'jetpack-migration'
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
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackMigrationInitialState;
	return (
		<ConnectScreen
			buttonLabel={ __( 'Get Started', 'jetpack-migration' ) }
			title={ __( 'WordPress.com Migration', 'jetpack-migration' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="jetpack-migration"
			redirectUri="admin.php?page=jetpack-migration"
			images={ [ connectImage ] }
		>
			<p>
				{ __(
					"Whether the result of poor performance, lack of support or limited bandwidth, migrating your site to WordPress.com shouldn't be hard. That's our job! Migrate your site now and get managed by experienced, dedicated and specailists on WordPress professionals.",
					'jetpack-migration'
				) }
			</p>
			<ul>
				<li>
					{ __(
						'No need to worry about budget - this is a free migration service offically provided by WordPress.com.',
						'jetpack-migration'
					) }
				</li>
				<li>
					{ __(
						'This is seamless and automated process. It takes one click to back-up and migrate your entire site to WordPress.com',
						'jetpack-migration'
					) }
				</li>
				<li>
					{ __( 'WordPress.com Migration provides low to zero downtime.', 'jetpack-migration' ) }
				</li>
			</ul>
		</ConnectScreen>
	);
};
