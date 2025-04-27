import {
	isAtomicSite,
	isSimpleSite,
	getRequiredPlan,
	useUpgradeFlow,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, _x, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import clsx from 'clsx';
import usePublicizeConfig from '../../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../../hooks/use-social-media-connections';

const getDescriptions = () => ( {
	start: __(
		'Start sharing your posts by connecting your social media accounts.',
		'jetpack-publicize-components'
	),
	enabled: __(
		'Click on the social icons below to control where you want to share your post.',
		'jetpack-publicize-components'
	),
	disabled: __(
		'Use this tool to share your post on all your social media accounts.',
		'jetpack-publicize-components'
	),
	reshare: __(
		'Enable the social media accounts where you want to re-share your post, then click on the "Share post" button below.',
		'jetpack-publicize-components'
	),
} );

/**
 * Get the panel description based on the current state.
 *
 * @param {boolean} isPostPublished    - Whether the post is published.
 * @param {boolean} isPublicizeEnabled - Whether Publicize is enabled.
 * @param {boolean} hasConnections     - Whether there are social media connections.
 *
 * @return {string} The panel description.
 */
function getPanelDescription( isPostPublished, isPublicizeEnabled, hasConnections ) {
	const descriptions = getDescriptions();

	if ( ! hasConnections ) {
		return descriptions.start;
	}

	if ( isPostPublished ) {
		// For published posts, always show the reshare description.
		return descriptions.reshare;
	}

	return isPublicizeEnabled ? descriptions.enabled : descriptions.disabled;
}

/**
 * Upsell notice for the Publicize feature.
 *
 * @return {React.ReactElement} The upsell notice.
 */
export function UpsellNotice() {
	const {
		isRePublicizeUpgradableViaUpsell,
		isRePublicizeFeatureAvailable,
		isPublicizeEnabled: isPublicizeEnabledFromConfig,
	} = usePublicizeConfig();
	const requiredPlan = getRequiredPlan( 'republicize' );
	const [ checkoutUrl, goToCheckoutPage, isRedirecting, planData ] = useUpgradeFlow(
		`${ requiredPlan }`
	);
	const { hasConnections } = useSocialMediaConnections();
	const isPublicizeEnabled = isPublicizeEnabledFromConfig && ! isRePublicizeUpgradableViaUpsell;
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	/*
	 * Publicize:
	 * When post is not published yet,
	 * or when the feature flag is disabled,
	 * just show the feature description and bail early.
	 */
	if ( ! isPostPublished || ( isPostPublished && isRePublicizeFeatureAvailable ) ) {
		return (
			<div className="jetpack-publicize__upsell">
				{ getPanelDescription( isPostPublished, isPublicizeEnabled, hasConnections ) }
			</div>
		);
	}

	// Define plan name, with a fallback value.
	const planName = planData?.product_name || __( 'paid', 'jetpack-publicize-components' );

	const isPureJetpackSite = ! isAtomicSite() && ! isSimpleSite();
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
					/* translators: placeholder is the product name of the plan. */
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
					/* translators: placeholder is the product name of the plan. */
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
