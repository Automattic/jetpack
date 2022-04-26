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

const ConnectionItem = props => {
	return props.connectionIds.map( connectionId => {
		const connection = jetpackSocial.connections[ props.provider ][ connectionId ];
		return (
			<div
				key={ connectionId + Date.now().toString( 36 ) + Math.random().toString( 36 ).substr( 2 ) }
			>
				<tr>
					<th className={ styles.connectionRow }> { __( 'Name', 'jetpack-social' ) }</th>
					<th className={ styles.connectionRow }>{ __( 'Image', 'jetpack-social' ) }</th>
				</tr>
				<tr>
					<td className={ styles.connectionRow }>{ connection.external_display }</td>
					<td className={ styles.connectionRow }>
						{ connection && (
							<img
								alt="connection avatar"
								src={ connection?.profile_picture ?? null }
								height="50px"
								width="50px"
							/>
						) }
					</td>
				</tr>
			</div>
		);
	} );
};

const ConnectionItems = () => {
	if ( ! jetpackSocial.connections ) {
		return null;
	}

	const providers = Object.keys( jetpackSocial.connections );
	return providers.map( provider => {
		return (
			<div key={ provider + Date.now().toString( 36 ) + Math.random().toString( 36 ).substr( 2 ) }>
				<h2> { provider.charAt( 0 ).toUpperCase() + provider.slice( 1 ) } Connections</h2>
				<table className={ styles.connectionTable }>
					<ConnectionItem
						connectionIds={ Object.keys( jetpackSocial.connections[ provider ] ) }
						provider={ provider }
					/>
				</table>
			</div>
		);
	} );
};
const Admin = () => {
	const connectionStatus = useSelect(
		select => select( CONNECTION_STORE_ID ).getConnectionStatus(),
		[]
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;
	return (
		<AdminPage moduleName={ __( 'Jetpack Social', 'jetpack-social' ) }>
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
								{ __( 'Social Media Automation for WordPress Sites', 'jetpack-social' ) }
							</h1>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>
									{ __(
										'Reach your maximum potential audience, not just those who visit your site',
										'jetpack-social'
									) }
								</li>
								<li>
									{ __(
										'Be found by prospective readers or customers on their preferred social site or network',
										'jetpack-social'
									) }
								</li>
								<li>
									{ __(
										'Allow people who like your content to easily share it with their own followers, giving you even greater visibility',
										'jetpack-social'
									) }
								</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<PricingCard
								title={ __( 'Jetpack Social', 'jetpack-social' ) }
								priceBefore={ 9 }
								priceAfter={ 4.5 }
								ctaText={ __( 'Get Jetpack Social', 'jetpack-social' ) }
								infoText={ __(
									'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
									'jetpack-social'
								) }
							/>
						</Col>
					</Container>
				) }
			</AdminSectionHero>
			<div className={ styles.publicizeConnectionsList }>
				<ConnectionItems />
			</div>
		</AdminPage>
	);
};

export default Admin;

const ConnectionSection = () => {
	const { apiNonce, apiRoot, registrationNonce } = window.jetpackSocialInitialState;
	return (
		<ConnectScreenRequiredPlan
			buttonLabel={ __( 'Get Jetpack Social', 'jetpack-social' ) }
			priceAfter={ 4.5 }
			priceBefore={ 9 }
			pricingTitle={ __( 'Jetpack Social', 'jetpack-social' ) }
			title={ __( 'Social Media Automation for WordPress Sites', 'jetpack-social' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="jetpack-social"
			redirectUri="admin.php?page=jetpack-social"
		>
			<h3>
				{ __(
					'Share your site’s posts on several social media networks automatically when you publish a new post',
					'jetpack-social'
				) }
			</h3>
			<ul>
				<li>
					{ __(
						'Reach your maximum potential audience, not just those who visit your site',
						'jetpack-social'
					) }
				</li>
				<li>
					{ __(
						'Be found by prospective readers or customers on their preferred social site or network',
						'jetpack-social'
					) }
				</li>
				<li>
					{ __(
						'Allow people who like your content to easily share it with their own followers, giving you even greater visibility',
						'jetpack-social'
					) }
				</li>
			</ul>
		</ConnectScreenRequiredPlan>
	);
};
