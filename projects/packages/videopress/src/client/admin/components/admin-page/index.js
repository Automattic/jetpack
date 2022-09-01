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
		<AdminPage moduleName={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }>
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
								{ __( 'The plugin headline.', 'jetpack-videopress-pkg' ) }
							</h1>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>
									{ __( 'All the amazing things this plugin does', 'jetpack-videopress-pkg' ) }
								</li>
								<li>
									{ __( 'Presented in a list of amazing features', 'jetpack-videopress-pkg' ) }
								</li>
								<li>{ __( 'And all the benefits you will get', 'jetpack-videopress-pkg' ) }</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<PricingCard
								title={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
								priceBefore={ 9 }
								priceAfter={ 4.5 }
								ctaText={ __( 'Get Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
								infoText={ __(
									'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
									'jetpack-videopress-pkg'
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
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackVideoPressInitialState;
	return (
		<ConnectScreenRequiredPlan
			buttonLabel={ __( 'Get Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			priceAfter={ 4.5 }
			priceBefore={ 9 }
			pricingTitle={ __( 'Jetpack VideoPress', 'jetpack-videopress-pkg' ) }
			title={ __( 'High quality, ad-free video.', 'jetpack-videopress-pkg' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="jetpack-videopress"
			redirectUri="admin.php?page=jetpack-videopress"
		>
			<h3>{ __( 'Connection screen title', 'jetpack-videopress-pkg' ) }</h3>
			<ul>
				<li>{ __( 'Amazing feature 1', 'jetpack-videopress-pkg' ) }</li>
				<li>{ __( 'Amazing feature 2', 'jetpack-videopress-pkg' ) }</li>
				<li>{ __( 'Amazing feature 3', 'jetpack-videopress-pkg' ) }</li>
			</ul>
		</ConnectScreenRequiredPlan>
	);
};
