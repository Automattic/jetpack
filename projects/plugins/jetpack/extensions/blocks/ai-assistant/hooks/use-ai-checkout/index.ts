/*
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	isAtomicSite,
	isSimpleSite,
	getSiteFragment,
} from '@automattic/jetpack-shared-extension-utils';
import useAutosaveAndRedirect from '../../../../shared/use-autosave-and-redirect';
import useAiFeature from '../use-ai-feature';
/*
 * Types
 */
import type { MouseEvent } from 'react';

const getWPComRedirectToURL = () => {
	const searchParams = new URLSearchParams( window.location.search );
	const site = getSiteFragment();

	if ( isSimpleSite() && searchParams.has( 'post' ) ) {
		// When there is an explicit post, use it as the destination
		return `https://wordpress.com/post/${ site }/${ searchParams.get( 'post' ) }`;
	}
	// When there is no explicit post, or the site is not Simple, use the home page as the destination
	return `https://wordpress.com/home/${ site }`;
};

export default function useAICheckout(): {
	checkoutUrl: string;
	autosaveAndRedirect: ( event: MouseEvent< HTMLButtonElement > ) => void;
	isRedirecting: boolean;
} {
	const { nextTier, tierPlansEnabled } = useAiFeature();

	const wpcomRedirectToURL = getWPComRedirectToURL();

	const wpcomCheckoutUrl = tierPlansEnabled
		? getRedirectUrl( 'jetpack-ai-yearly-tier-upgrade-nudge', {
				site: getSiteFragment() as string,
				path: `jetpack_ai_yearly:-q-${ nextTier?.limit }`,
				query: `redirect_to=${ encodeURIComponent( wpcomRedirectToURL ) }`,
		  } )
		: getRedirectUrl( 'jetpack-ai-monthly-plan-ai-assistant-block-banner', {
				site: getSiteFragment() as string,
		  } );

	const checkoutUrl =
		isAtomicSite() || isSimpleSite()
			? wpcomCheckoutUrl
			: `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?redirect_to_referrer=1&page=my-jetpack#/add-jetpack-ai`;

	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( checkoutUrl );

	return {
		checkoutUrl,
		autosaveAndRedirect,
		isRedirecting,
	};
}
