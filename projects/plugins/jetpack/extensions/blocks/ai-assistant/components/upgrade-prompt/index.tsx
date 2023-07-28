/*
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	isAtomicSite,
	isSimpleSite,
	getSiteFragment,
} from '@automattic/jetpack-shared-extension-utils';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
/*
 * Internal dependencies
 */
import { Nudge } from '../../../../shared/components/upgrade-nudge';
import useAutosaveAndRedirect from '../../../../shared/use-autosave-and-redirect';
import useAIFeature from '../../hooks/use-ai-feature';

/**
 * The default upgrade prompt for the AI Assistant block, containing the Upgrade button and linking
 * to the checkout page or the Jetpack AI interstitial page.
 *
 * @returns {React.ReactNode} the Nudge component with the prompt.
 */
const DefaultUpgradePrompt = (): React.ReactNode => {
	const wpcomCheckoutUrl = getRedirectUrl( 'jetpack-ai-monthly-plan-ai-assistant-block-banner', {
		site: getSiteFragment(),
	} );

	const checkoutUrl =
		isAtomicSite() || isSimpleSite()
			? wpcomCheckoutUrl
			: `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?page=my-jetpack#/add-jetpack-ai`;

	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( checkoutUrl );

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
	const { upgradeType } = useAIFeature();

	// If the user is on a VIP site, show the VIP upgrade prompt.
	if ( upgradeType === 'vip' ) {
		return VIPUpgradePrompt();
	}

	return DefaultUpgradePrompt();
};

export default UpgradePrompt;
