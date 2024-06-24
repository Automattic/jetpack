import {
	useSocialMediaConnections,
	usePublicizeConfig,
} from '@automattic/jetpack-publicize-components';
import {
	isAtomicSite,
	isSimpleSite,
	getRequiredPlan,
} from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import clsx from 'clsx';
import useUpgradeFlow from '../../../../shared/use-upgrade-flow';

const getDescriptions = () => ( {
	start: __( 'Start sharing your posts by connecting your social media accounts.', 'jetpack' ),
	enabled: __(
		'Click on the social icons below to control where you want to share your post.',
		'jetpack'
	),
	disabled: __( 'Use this tool to share your post on all your social media accounts.', 'jetpack' ),
	reshare: __(
		'Enable the social media accounts where you want to re-share your post, then click on the "Share post" button below.',
		'jetpack'
	),
} );

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

export default function UpsellNotice() {
	const {
		isRePublicizeUpgradableViaUpsell,
		isRePublicizeFeatureAvailable,
		isPublicizeEnabled: isPublicizeEnabledFromConfig,
	} = usePublicizeConfig();
	const requiredPlan = getRequiredPlan( 'republicize' );
	const [ checkoutUrl, goToCheckoutPage, isRedirecting, planData ] = useUpgradeFlow( requiredPlan );
	const { hasConnections, hasEnabledConnections } = useSocialMediaConnections();
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
				{ getPanelDescription(
					isPostPublished,
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
					__( 'To re-share a post, you need to upgrade to the %s plan', 'jetpack' ),
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
				{ isRedirecting ? __( 'Redirecting…', 'jetpack' ) : buttonText }
			</Button>
		</div>
	);
}
