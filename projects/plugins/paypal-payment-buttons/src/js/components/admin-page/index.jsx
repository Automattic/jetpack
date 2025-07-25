import {
	AdminPage,
	AdminSectionHero,
	Container,
	Col,
	PricingCard,
} from '@automattic/jetpack-components';
import { ConnectScreenRequiredPlan, CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { shouldUseInternalLinks } from '@automattic/jetpack-shared-extension-utils';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const Admin = () => {
	const connectionStatus = useSelect( select =>
		select( CONNECTION_STORE_ID ).getConnectionStatus()
	);
	const { isUserConnected, isRegistered } = connectionStatus;
	const showConnectionCard = ! isRegistered || ! isUserConnected;

	return (
		<AdminPage
			moduleName={ __( 'PayPal Payment Buttons', 'paypal-payment-buttons' ) }
			useInternalLinks={ shouldUseInternalLinks() }
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
							<div id="jp-admin-notices" className="paypal-payment-buttons-jitm-card" />
						</Col>
						<Col sm={ 4 } md={ 6 } lg={ 6 }>
							<h1 className={ styles.heading }>
								{ __( 'Accept PayPal payments on your site.', 'paypal-payment-buttons' ) }
							</h1>
							<ul className={ styles[ 'jp-product-promote' ] }>
								<li>{ __( 'Easy PayPal button integration', 'paypal-payment-buttons' ) }</li>
								<li>{ __( 'Secure payment processing', 'paypal-payment-buttons' ) }</li>
								<li>{ __( 'Trusted by millions worldwide', 'paypal-payment-buttons' ) }</li>
							</ul>
						</Col>
						<Col lg={ 1 } md={ 1 } sm={ 0 } />
						<Col sm={ 4 } md={ 5 } lg={ 5 }>
							<PricingCard
								title={ __( 'PayPal Payment Buttons', 'paypal-payment-buttons' ) }
								priceBefore={ 9 }
								priceAfter={ 4.5 }
								ctaText={ __( 'Get PayPal Payment Buttons', 'paypal-payment-buttons' ) }
								infoText={ __(
									'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
									'paypal-payment-buttons'
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
	const { apiNonce, apiRoot, registrationNonce } = window.paypalPaymentButtonsInitialState;
	return (
		<ConnectScreenRequiredPlan
			buttonLabel={ __( 'Get PayPal Payment Buttons', 'paypal-payment-buttons' ) }
			priceAfter={ 4.5 }
			priceBefore={ 9 }
			pricingTitle={ __( 'PayPal Payment Buttons', 'paypal-payment-buttons' ) }
			title={ __(
				'Add PayPal payment buttons to your WordPress site with ease.',
				'paypal-payment-buttons'
			) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="paypal-payment-buttons"
			redirectUri="admin.php?page=paypal-payment-buttons"
		>
			<h3>{ __( 'Connect to start accepting PayPal payments', 'paypal-payment-buttons' ) }</h3>
			<ul>
				<li>{ __( 'Accept payments with PayPal', 'paypal-payment-buttons' ) }</li>
				<li>{ __( 'Secure payment processing', 'paypal-payment-buttons' ) }</li>
				<li>{ __( 'Easy button customization', 'paypal-payment-buttons' ) }</li>
			</ul>
		</ConnectScreenRequiredPlan>
	);
};
