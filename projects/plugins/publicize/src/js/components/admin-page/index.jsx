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
		<AdminPage moduleName={ __( 'Jetpack Reach', 'jetpack-reach' ) }>
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
								{ __( 'Social Media Automation for WordPress Sites', 'jetpack-reach' ) }
							</h1>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>
									{ __(
										'Reach your maximum potential audience, not just those who visit your site',
										'jetpack-reach'
									) }
								</li>
								<li>
									{ __(
										'Be found by prospective readers or customers on their preferred social site or network',
										'jetpack-reach'
									) }
								</li>
								<li>
									{ __(
										'Allow people who like your content to easily share it with their own followers, giving you even greater visibility',
										'jetpack-reach'
									) }
								</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<PricingCard
								title={ __( 'Jetpack Reach', 'jetpack-reach' ) }
								priceBefore={ 9 }
								priceAfter={ 4.5 }
								ctaText={ __( 'Get Jetpack Reach', 'jetpack-reach' ) }
								infoText={ __(
									'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
									'jetpack-reach'
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
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackReachInitialState;
	return (
		<ConnectScreenRequiredPlan
			buttonLabel={ __( 'Get Jetpack Reach', 'jetpack-reach' ) }
			priceAfter={ 4.5 }
			priceBefore={ 9 }
			pricingTitle={ __( 'Jetpack Reach', 'jetpack-reach' ) }
			title={ __( 'Social Media Automation for WordPress Sites', 'jetpack-reach' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="jetpack-reach"
			redirectUri="admin.php?page=jetpack-reach"
		>
			<h3>
				{ __(
					'Share your site’s posts on several social media networks automatically when you publish a new post',
					'jetpack-reach'
				) }
			</h3>
			<ul>
				<li>
					{ __(
						'Reach your maximum potential audience, not just those who visit your site',
						'jetpack-reach'
					) }
				</li>
				<li>
					{ __(
						'Be found by prospective readers or customers on their preferred social site or network',
						'jetpack-reach'
					) }
				</li>
				<li>
					{ __(
						'Allow people who like your content to easily share it with their own followers, giving you even greater visibility',
						'jetpack-reach'
					) }
				</li>
			</ul>
		</ConnectScreenRequiredPlan>
	);
};
