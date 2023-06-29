/*
 * External dependencies
 */
import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
/*
 * Internal dependencies
 */
import { Nudge } from '../../../../shared/components/upgrade-nudge';
import useAutosaveAndRedirect from '../../../../shared/use-autosave-and-redirect';
import useUpgradeFlow from '../../../../shared/use-upgrade-flow';

const useAIAssistantUpgradeFlow = () => {
	// Direct checkout flow for atomic and simple sites, as they do not have My Jetpack.
	const [ directCheckoutUrl, goToCheckoutPage, isRedirecting ] =
		useUpgradeFlow( 'jetpack_ai_monthly' );

	// My Jetpack checkout flow for Jetpack sites.
	const myJetpackCheckoutUrl = `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?page=my-jetpack#/add-jetpack-ai`;
	const { autosaveAndRedirect, isRedirecting: isRedirectingMyJetpack } =
		useAutosaveAndRedirect( myJetpackCheckoutUrl );

	if ( isAtomicSite() || isSimpleSite() ) {
		return { checkoutUrl: directCheckoutUrl, goToCheckoutPage, isRedirecting };
	}

	return {
		checkoutUrl: myJetpackCheckoutUrl,
		goToCheckoutPage: autosaveAndRedirect,
		isRedirecting: isRedirectingMyJetpack,
	};
};

const UpgradePrompt = () => {
	const { checkoutUrl, goToCheckoutPage, isRedirecting } = useAIAssistantUpgradeFlow();

	return (
		<Nudge
			buttonText={ 'Upgrade' }
			checkoutUrl={ checkoutUrl }
			className={ 'jetpack-ai-upgrade-banner' }
			description={ createInterpolateElement(
				__(
					'You have reached the limit of free requests.<br /> Upgrade now to keep using Jetpack AI.',
					'jetpack'
				),
				{
					br: <br />,
				}
			) }
			goToCheckoutPage={ goToCheckoutPage }
			isRedirecting={ isRedirecting }
			visible={ true }
			align={ null }
			title={ null }
			context={ null }
		/>
	);
};

export default UpgradePrompt;
