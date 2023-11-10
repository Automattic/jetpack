/*
 * External dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
/*
 * Internal dependencies
 */
import { Nudge } from '../../../../shared/components/upgrade-nudge';
import useAICheckout from '../../hooks/use-ai-checkout';
import useAiFeature from '../../hooks/use-ai-feature';
import { canUserPurchasePlan } from '../../lib/connection';

/**
 * The default upgrade prompt for the AI Assistant block, containing the Upgrade button and linking
 * to the checkout page or the Jetpack AI interstitial page.
 *
 * @returns {React.ReactNode} the Nudge component with the prompt.
 */
const DefaultUpgradePrompt = (): React.ReactNode => {
	const { checkoutUrl, autosaveAndRedirect, isRedirecting } = useAICheckout();
	const canUpgrade = canUserPurchasePlan();

	if ( ! canUpgrade ) {
		return (
			<Nudge
				showButton={ false }
				className={ 'jetpack-ai-upgrade-banner' }
				description={ createInterpolateElement(
					__(
						'Congratulations on exploring Jetpack AI and reaching the free requests limit!<br /><strong>Reach out to the site administrator to upgrade and keep using Jetpack AI.</strong>',
						'jetpack'
					),
					{
						br: <br />,
						strong: <strong />,
					}
				) }
				visible={ true }
				align={ null }
				title={ null }
				context={ null }
			/>
		);
	}

	return (
		<Nudge
			buttonText={ 'Upgrade' }
			checkoutUrl={ checkoutUrl }
			className={ 'jetpack-ai-upgrade-banner' }
			description={ createInterpolateElement(
				__(
					'Congratulations on exploring Jetpack AI and reaching the free requests limit!<br /><strong>Upgrade now to keep using it.</strong>',
					'jetpack'
				),
				{
					br: <br />,
					strong: <strong />,
				}
			) }
			goToCheckoutPage={ autosaveAndRedirect }
			isRedirecting={ isRedirecting }
			visible={ true }
			align={ null }
			title={ null }
			context={ null }
		/>
	);
};

/**
 * The VIP upgrade prompt, with a single text message recommending that the user reach
 * out to their VIP account team.
 *
 * @returns {React.ReactNode} the Nudge component with the prompt.
 */
const VIPUpgradePrompt = (): React.ReactNode => {
	return (
		<Nudge
			buttonText={ null }
			checkoutUrl={ null }
			className={ 'jetpack-ai-upgrade-banner' }
			description={ createInterpolateElement(
				__(
					"You've reached the Jetpack AI rate limit. <strong>Please reach out to your VIP account team.</strong>",
					'jetpack'
				),
				{
					strong: <strong />,
				}
			) }
			goToCheckoutPage={ null }
			isRedirecting={ null }
			visible={ true }
			align={ null }
			title={ null }
			context={ null }
		/>
	);
};

const UpgradePrompt = () => {
	const { upgradeType } = useAiFeature();

	// If the user is on a VIP site, show the VIP upgrade prompt.
	if ( upgradeType === 'vip' ) {
		return VIPUpgradePrompt();
	}

	return DefaultUpgradePrompt();
};

export default UpgradePrompt;
