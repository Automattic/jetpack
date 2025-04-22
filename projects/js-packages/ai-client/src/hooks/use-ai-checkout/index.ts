/*
 * External dependencies
 */
import getRedirectUrl from '@automattic/jetpack-components/tools/jp-redirect';
import {
	isAtomicSite,
	isSimpleSite,
	getSiteFragment,
	useAutosaveAndRedirect,
} from '@automattic/jetpack-shared-extension-utils';
import useAiFeature from '../use-ai-feature/index.ts';
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

type UseAICheckoutReturn = {
	checkoutUrl: string;
	autosaveAndRedirect: ( event: MouseEvent< HTMLButtonElement > ) => void;
	isRedirecting: boolean;
};

/**
 * The hook to get properties for AICheckout
 *
 * @return {UseAICheckoutReturn} - Object containing properties for AICheckout.
 */
export default function useAICheckout(): UseAICheckoutReturn {
	const { nextTier, tierPlansEnabled } = useAiFeature();

	const wpcomRedirectToURL = getWPComRedirectToURL();

	const wpcomCheckoutUrl = getRedirectUrl( 'jetpack-ai-yearly-tier-upgrade-nudge', {
		site: getSiteFragment() as string,
		path: tierPlansEnabled ? `jetpack_ai_yearly:-q-${ nextTier?.limit }` : 'jetpack_ai_yearly',
		query: `redirect_to=${ encodeURIComponent( wpcomRedirectToURL ) }`,
	} );

	const jetpackCheckoutUrl = getRedirectUrl( 'jetpack-ai-upgrade-url-for-jetpack-sites', {
		site: getSiteFragment() as string,
		path: 'jetpack_ai_yearly',
	} );

	const checkoutUrl = isAtomicSite() || isSimpleSite() ? wpcomCheckoutUrl : jetpackCheckoutUrl;

	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( checkoutUrl );

	return {
		checkoutUrl,
		autosaveAndRedirect,
		isRedirecting,
	};
}
