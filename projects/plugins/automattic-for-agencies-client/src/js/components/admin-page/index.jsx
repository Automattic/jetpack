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
import ConnectionCard from '../connection-card';
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
			moduleName={ __( 'Automattic For Agencies Client', 'automattic-for-agencies-client' ) }
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
							<div id="jp-admin-notices" className="automattic-for-agencies-client-jitm-card" />
						</Col>
						<Col sm={ 4 } md={ 6 } lg={ 6 }>
							<h1 className={ styles.heading }>
								{ __( 'The plugin headline.', 'automattic-for-agencies-client' ) }
							</h1>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>
									{ __(
										'All the amazing things this plugin does',
										'automattic-for-agencies-client'
									) }
								</li>
								<li>
									{ __(
										'Presented in a list of amazing features',
										'automattic-for-agencies-client'
									) }
								</li>
								<li>
									{ __( 'And all the benefits you will get', 'automattic-for-agencies-client' ) }
								</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<PricingCard
								title={ __( 'Automattic For Agencies Client', 'automattic-for-agencies-client' ) }
								priceBefore={ 9 }
								priceAfter={ 4.5 }
								ctaText={ __(
									'Get Automattic For Agencies Client',
									'automattic-for-agencies-client'
								) }
								infoText={ __(
									'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
									'automattic-for-agencies-client'
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
	// const { apiNonce, apiRoot, registrationNonce } = window.automatticForAgenciesClientInitialState;
	return <ConnectionCard />;
};
