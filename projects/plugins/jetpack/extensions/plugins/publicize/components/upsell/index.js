/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getRequiredPlan } from '../../../../shared/plan-utils';
import useUpgradeFlow from '../../../../shared/use-upgrade-flow';
import usePublicizeConfig from '../../hooks/use-publicize-config';

export default function UpsellNotice() {
	const { isRePublicizeFeatureEnabled, isRePublicizeFeatureUpgradable } = usePublicizeConfig();

	const requiredPlan = getRequiredPlan( 'republicize' );
	const [ checkoutUrl, goToCheckoutPage, isRedirecting ] = useUpgradeFlow( requiredPlan );

	if ( ! isRePublicizeFeatureEnabled || ! isRePublicizeFeatureUpgradable ) {
		return null;
	}

	return (
		<div className="jetpack-publicize__upsell">
			<div className="jetpack-publicize__upsell-description">
				{ __(
					'To re-publicize and schedule a post, you need to upgrade to the Personal Plan',
					'jetpack'
				) }
			</div>

			<Button
				href={ isRedirecting ? null : checkoutUrl } // Only for server-side rendering, since onClick doesn't work there.
				onClick={ goToCheckoutPage }
				target="_top"
				className={ classNames( 'jetpack-publicize__upsell-button is-primary', {
					'jetpack-upgrade-plan__hidden': ! checkoutUrl,
				} ) }
				isBusy={ isRedirecting }
			>
				{ isRedirecting ? __( 'Redirecting…', 'jetpack' ) : __( 'Upgrade now', 'jetpack' ) }
			</Button>
		</div>
	);
}
