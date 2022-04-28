/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ConnectScreenRequiredPlan } from '@automattic/jetpack-connection';

/**
 * Internal dependencies
 */
import { isBlogOptInWooAds } from '../../utils';

export const ConnectionSection = () => {
	const { apiNonce, apiRoot, registrationNonce } = window.wooAdsInitialState;

	return (
		<ConnectScreenRequiredPlan
			buttonLabel={ __( 'Get WooAds', 'wooads' ) }
			priceAfter={ 4.5 }
			priceBefore={ 9 }
			pricingTitle={ __( 'WooAds', 'wooads' ) }
			title={ __( 'Promote your WooCommerce products and content using ads', 'wooads' ) }
			apiRoot={ apiRoot }
			apiNonce={ apiNonce }
			registrationNonce={ registrationNonce }
			from="wooads"
			redirectUri="admin.php?page=wooads"
		>
			{ isBlogOptInWooAds() ? (
				<p>yes</p>
			) : (
				<p>
					<a href="https://wordads.co/advertise/signup/{blogId}">
						{ __( 'Click here to start promoting your eCommerce', 'wooads' ) }
					</a>
				</p>
			) }

			<h3>{ __( 'Connection screen title', 'wooads' ) }</h3>
			<ul>
				<li>{ __( 'Amazing feature 1', 'wooads' ) }</li>
				<li>{ __( 'Amazing feature 2', 'wooads' ) }</li>
				<li>{ __( 'Amazing feature 3', 'wooads' ) }</li>
			</ul>
		</ConnectScreenRequiredPlan>
	);
};
