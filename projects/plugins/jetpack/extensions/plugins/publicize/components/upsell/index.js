/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { external } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { getRequiredPlan } from '../../../../shared/plan-utils';
import useUpgradeFlow from '../../../../shared/use-upgrade-flow';
import usePublicizeConfig from '../../hooks/use-publicize-config';

export default function UpsellNotice( { isPostPublished } ) {
	const { isRePublicizeFeatureEnabled, isRePublicizeFeatureUpgradable } = usePublicizeConfig();
	const requiredPlan = getRequiredPlan( 'republicize' );
	const [ checkoutUrl, goToCheckoutPage, isRedirecting, planData ] = useUpgradeFlow( requiredPlan );

	// Nothing to show here. Move on...
	if ( ! isPostPublished ) {
		return null;
	}

	/*
	 * Do not render either when the feature is not enabled,
	 * or when the feature is enabled and not upgradable.
	 */
	if ( ! isRePublicizeFeatureEnabled || ! isRePublicizeFeatureUpgradable ) {
		return null;
	}

	return (
		<div className="jetpack-publicize__upsell">
			<div className="jetpack-publicize__upsell-description">
				{ sprintf(
					/* translators: placeholder is the product name of the plan. */
					__( 'To re publicize a post, you need to upgrade to the %s plan', 'jetpack' ),
					planData?.product_name
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
				{ isRedirecting
					? __( 'Redirecting…', 'jetpack' )
					: sprintf(
							/* translators: placeholder is the price for upgrading. */
							'Upgrade now for %s',
							planData?.formatted_price
					  ) }
			</Button>
		</div>
	);
}
