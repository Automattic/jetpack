import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	PricingCard,
} from '@automattic/jetpack-components';
import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { Migration } from '../migration';
import styles from './styles.module.scss';

const Admin = () => {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackMigrationInitialState;

	return (
		<AdminPage
			moduleName={ __( `Move to WordPress.com`, 'jetpack-migration' ) }
			showBackground={ false }
			showHeader={ false }
			showFooter={ false }
		>
			<AdminSectionHero>
				{ showConnectionCard ? (
					<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
						<Col sm={ 4 } md={ 8 } lg={ 12 }>
							<Migration
								apiRoot={ apiRoot }
								apiNonce={ apiNonce }
								registrationNonce={ registrationNonce }
							/>
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
