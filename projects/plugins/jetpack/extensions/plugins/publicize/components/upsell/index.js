/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button, ExternalLink } from '@wordpress/components';
import { external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getRequiredPlan } from '../../../../shared/plan-utils';
import useUpgradeFlow from '../../../../shared/use-upgrade-flow';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import { isAtomicSite, isSimpleSite } from '../../../../shared/site-type-utils';

export default function UpsellNotice( { isPostPublished } ) {
	const {
		isRePublicizeFeatureEnabled,
		isRePublicizeUpgradableViaUpsell,
		isRePublicizeFeatureAvailable,
	} = usePublicizeConfig();
	const requiredPlan = getRequiredPlan( 'republicize' );
	const [ checkoutUrl, goToCheckoutPage, isRedirecting, planData ] = useUpgradeFlow( requiredPlan );

	/*
	 * Publicize:
	 * When post is not published,
	 * there is nothing to show here. Move on...
	 */
	if ( ! isPostPublished ) {
		return null;
	}

	// Bail early with null when feature flag is not enabled.
	if ( ! isRePublicizeFeatureEnabled ) {
		return null;
	}

	// Define plan name, with a fallback value.
	const planName = planData?.product_name || __( 'Paid', 'jetpack' );

	const isPureJetpackSite = ! isAtomicSite() && ! isSimpleSite();
	const upgradeFeatureTitle = isPureJetpackSite
		? __( 'Re-sharing your content', 'jetpack' )
		: __( 'Share Your Content Again', 'jetpack' );

	// Doc page URL.
	const docPageUrl = isPureJetpackSite
		? 'https://jetpack.com/support/publicize/#re-sharing-your-content'
		: 'https://wordpress.com/support/publicize/#share-your-content-again';

	const buttonText = planData?.formatted_price
		? sprintf(
				/* translators: placeholder is the price for upgrading. */
				'Upgrade now for %s',
				planData.formatted_price
		  )
		: __( 'Upgrade now', 'jetpack' );

	/*
	 * Render an info message when the feature is not available
	 * and when it shouldn't show upgrade notices.
	 * (pure Jetpack sites, for instance).
	 */
	if ( ! isRePublicizeFeatureAvailable && ! isRePublicizeUpgradableViaUpsell ) {
		return (
			<div className="jetpack-publicize__upsell">
				<strong>{ upgradeFeatureTitle }</strong>

				<br />

				{ sprintf(
					/* translators: placeholder is the product name of the plan. */
					__( 'This feature is for sites with a %s plan.', 'jetpack' ),
					planName
				) }

				<br />

				<ExternalLink href={ docPageUrl }>{ __( 'More information.', 'jetpack' ) }</ExternalLink>
			</div>
		);
	}

	return (
		<div className="jetpack-publicize__upsell">
			<div className="jetpack-publicize__upsell-description">
				{ sprintf(
					/* translators: placeholder is the product name of the plan. */
					__( 'To re-share a post, you need to upgrade to the %s plan', 'jetpack' ),
					planName
				) }
			</div>

			<Button
				href={ isRedirecting ? null : checkoutUrl } // Only for server-side rendering, since onClick doesn't work there.
				onClick={ goToCheckoutPage }
				target="_top"
				icon={ external }
				className={ classNames( 'jetpack-publicize__upsell-button is-primary', {
					'jetpack-upgrade-plan__hidden': ! checkoutUrl,
				} ) }
				isBusy={ isRedirecting }
			>
				{ isRedirecting ? __( 'Redirecting…', 'jetpack' ) : buttonText }
			</Button>
		</div>
	);
}
