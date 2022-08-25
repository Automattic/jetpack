import { useSocialMediaConnections } from '@automattic/jetpack-publicize-components';
import {
	isAtomicSite,
	isSimpleSite,
	getRequiredPlan,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import classNames from 'classnames';
import useUpgradeFlow from '../../../../shared/use-upgrade-flow';
import usePublicizeConfig from '../../hooks/use-publicize-config';

function getPanelDescription(
	isPostPublished,
	isRePublicizeFeatureEnabled,
	isPublicizeEnabled,
	hasConnections,
	hasEnabledConnections
) {
	// Use constants when the string is used in multiple places.
	const start_your_posts_string = __(
		'Start sharing your posts by connecting your social media accounts.',
		'jetpack'
	);
	const this_post_will_string = __(
		'This post will be shared on all your enabled social media accounts the moment you publish the post.',
		'jetpack'
	);

	// RePublicize feature is disabled.
	if ( ! isRePublicizeFeatureEnabled ) {
		if ( isPostPublished ) {
			return start_your_posts_string;
		}

		return this_post_will_string;
	}

	// RePublicize feature is enabled.
	// No connections.
	if ( ! hasConnections ) {
		return start_your_posts_string;
	}

	if ( ! isPublicizeEnabled || ! hasEnabledConnections ) {
		return __( 'Use this tool to share your post on all your social media accounts.', 'jetpack' );
	}

	if ( isPublicizeEnabled && hasEnabledConnections && ! isPostPublished ) {
		return this_post_will_string;
	}

	return __(
		'Share this post on all your enabled social media accounts by clicking on the share post button.',
		'jetpack'
	);
}

export default function UpsellNotice( { isPostPublished } ) {
	const {
		isRePublicizeFeatureEnabled,
		isRePublicizeUpgradableViaUpsell,
		isRePublicizeFeatureAvailable,
		isPublicizeEnabled: isPublicizeEnabledFromConfig,
	} = usePublicizeConfig();
	const requiredPlan = getRequiredPlan( 'republicize' );
	const [ checkoutUrl, goToCheckoutPage, isRedirecting, planData ] = useUpgradeFlow( requiredPlan );
	const { hasConnections, hasEnabledConnections } = useSocialMediaConnections();
	const isPublicizeEnabled =
		isPublicizeEnabledFromConfig &&
		! ( isRePublicizeUpgradableViaUpsell && isRePublicizeFeatureEnabled );

	/*
	 * Publicize:
	 * When post is not published yet,
	 * or when the feature flag is disabled,
	 * just show the feature description and bail early.
	 */
	if (
		! isPostPublished ||
		! isRePublicizeFeatureEnabled ||
		( isPostPublished && isRePublicizeFeatureAvailable )
	) {
		return (
			<div>
				{ getPanelDescription(
					isPostPublished,
					isRePublicizeFeatureEnabled,
					isPublicizeEnabled,
					hasConnections,
					hasEnabledConnections
				) }
			</div>
		);
	}

	// Define plan name, with a fallback value.
	const planName = planData?.product_name || __( 'paid', 'jetpack' );

	const isPureJetpackSite = ! isAtomicSite() && ! isSimpleSite();
	const upgradeFeatureTitle = isPureJetpackSite
		? __( 'Re-sharing your content', 'jetpack' )
		: __( 'Share Your Content Again', 'jetpack', /* dummy arg to avoid bad minification */ 0 );

	// Doc page URL.
	const docPageUrl = isPureJetpackSite
		? 'https://jetpack.com/support/jetpack-social/#re-sharing-your-content'
		: 'https://wordpress.com/support/jetpack-social/#share-your-content-again';

	const buttonText = __( 'Upgrade now', 'jetpack' );

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
					__( 'To re-share a post, you need to upgrade to the super %s plan', 'jetpack' ),
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
