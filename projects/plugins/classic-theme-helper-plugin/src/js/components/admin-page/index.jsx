import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	PricingCard,
} from '@automattic/jetpack-components';
import { ConnectScreenRequiredPlan, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React from 'react';
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
			moduleName={ __( 'Jetpack Classic Theme Helper Plugin', 'classic-theme-helper-plugin' ) }
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
							<div id="jp-admin-notices" className="classic-theme-helper-plugin-jitm-card" />
						</Col>
						<Col sm={ 4 } md={ 6 } lg={ 6 }>
							<h1 className={ styles.heading }>
								{ __( 'The plugin headline.', 'classic-theme-helper-plugin' ) }
							</h1>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>
									{ __( 'All the amazing things this plugin does', 'classic-theme-helper-plugin' ) }
								</li>
								<li>
									{ __( 'Presented in a list of amazing features', 'classic-theme-helper-plugin' ) }
								</li>
								<li>
									{ __( 'And all the benefits you will get', 'classic-theme-helper-plugin' ) }
								</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<PricingCard
								title={ __( 'Jetpack Classic Theme Helper Plugin', 'classic-theme-helper-plugin' ) }
								priceBefore={ 9 }
								priceAfter={ 4.5 }
								ctaText={ __(
									'Get Jetpack Classic Theme Helper Plugin',
									'classic-theme-helper-plugin'
								) }
								infoText={ __(
									'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
									'classic-theme-helper-plugin'
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
	const { apiNonce, apiRoot, registrationNonce } =
		window.jetpackClassicThemeHelperPluginInitialState;
	return (
		<ConnectScreenRequiredPlan
			buttonLabel={ __( 'Get Jetpack Classic Theme Helper Plugin', 'classic-theme-helper-plugin' ) }
			priceAfter={ 4.5 }
			priceBefore={ 9 }
			pricingTitle={ __( 'Jetpack Classic Theme Helper Plugin', 'classic-theme-helper-plugin' ) }
			title={ __( 'Features for classic themes.', 'classic-theme-helper-plugin' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="classic-theme-helper-plugin"
			redirectUri="admin.php?page=classic-theme-helper-plugin"
		>
			<h3>{ __( 'Connection screen title', 'classic-theme-helper-plugin' ) }</h3>
			<ul>
				<li>{ __( 'Amazing feature 1', 'classic-theme-helper-plugin' ) }</li>
				<li>{ __( 'Amazing feature 2', 'classic-theme-helper-plugin' ) }</li>
				<li>{ __( 'Amazing feature 3', 'classic-theme-helper-plugin' ) }</li>
			</ul>
		</ConnectScreenRequiredPlan>
	);
};
