import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { getRequiredPlan, useUpgradeFlow } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, _x, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import clsx from 'clsx';
import usePublicizeConfig from '../../hooks/use-publicize-config';

/**
 * Upsell notice for the Publicize feature.
 *
 * @return The upsell notice.
 */
export function UpsellNotice() {
	const { isRePublicizeUpgradableViaUpsell, isRePublicizeFeatureAvailable } = usePublicizeConfig();
	const requiredPlan = getRequiredPlan( 'republicize' );
	const [ checkoutUrl, goToCheckoutPage, isRedirecting, planData ] = useUpgradeFlow(
		`${ requiredPlan }`
	);
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	/*
	 * Publicize:
	 * When post is not published yet,
	 * or when the feature flag is disabled,
	 * just bail early.
	 */
	if ( ! isPostPublished || ( isPostPublished && isRePublicizeFeatureAvailable ) ) {
		return null;
	}

	// Define plan name, with a fallback value.
	const planName = planData?.product_name || __( 'paid', 'jetpack-publicize-components' );

	const isPureJetpackSite = ! isWpcomPlatformSite();
	const upgradeFeatureTitle = isPureJetpackSite
		? __( 'Re-sharing your content', 'jetpack-publicize-components' )
		: _x( 'Share Your Content Again', '', 'jetpack-publicize-components' );

	// Doc page URL.
	const docPageUrl = isPureJetpackSite
		? 'https://jetpack.com/support/jetpack-social/#re-sharing-your-content'
		: 'https://wordpress.com/support/jetpack-social/#share-your-content-again';

	const buttonText = __( 'Upgrade now', 'jetpack-publicize-components' );

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
					/* translators: %s: the product name of the plan. */
					__( 'This feature is for sites with a %s plan.', 'jetpack-publicize-components' ),
					planName
				) }

				<br />

				<ExternalLink href={ docPageUrl }>
					{ __( 'More information.', 'jetpack-publicize-components' ) }
				</ExternalLink>
			</div>
		);
	}

	return (
		<div className="jetpack-publicize__upsell">
			<div className="jetpack-publicize__upsell-description">
				{ sprintf(
					/* translators: %s: the product name of the plan. */
					__(
						'To re-share a post, you need to upgrade to the %s plan',
						'jetpack-publicize-components'
					),
					planName
				) }
			</div>

			<Button
				href={ isRedirecting ? null : checkoutUrl } // Only for server-side rendering, since onClick doesn't work there.
				onClick={ goToCheckoutPage }
				target="_top"
				icon={ external }
				className={ clsx( 'jetpack-publicize__upsell-button is-primary', {
					'jetpack-upgrade-plan__hidden': ! checkoutUrl,
				} ) }
				isBusy={ isRedirecting }
			>
				{ isRedirecting ? __( 'Redirecting…', 'jetpack-publicize-components' ) : buttonText }
			</Button>
		</div>
	);
}
