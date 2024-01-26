/*
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import {
	isAtomicSite,
	isSimpleSite,
	getSiteFragment,
} from '@automattic/jetpack-shared-extension-utils';
import { useEffect, useState } from '@wordpress/element';
import useAutosaveAndRedirect from '../../../../shared/use-autosave-and-redirect';
import useAiFeature from '../use-ai-feature';

export default function useAICheckout(): {
	checkoutUrl: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	autosaveAndRedirect: ( event: any ) => void;
	isRedirecting: boolean;
} {
	const { nextTier, tierPlansEnabled } = useAiFeature();
	const [ currentLocation, setCurrentLocation ] = useState( window.location.href );

	useEffect( () => {
		if ( currentLocation !== window.location.href ) {
			setCurrentLocation( window.location.href );
		}
	}, [ currentLocation ] );

	const wpcomCheckoutUrl = tierPlansEnabled
		? getRedirectUrl( 'jetpack-ai-yearly-tier-upgrade-nudge', {
				site: getSiteFragment(),
				path: `jetpack_ai_yearly:-q-${ nextTier?.limit }`,
				query: `redirect_to=${ encodeURIComponent( currentLocation ) }`,
		  } )
		: getRedirectUrl( 'jetpack-ai-monthly-plan-ai-assistant-block-banner', {
				site: getSiteFragment(),
		  } );

	const checkoutUrl =
		isAtomicSite() || isSimpleSite()
			? wpcomCheckoutUrl
			: `${ window?.Jetpack_Editor_Initial_State
					?.adminUrl }admin.php?redirect_to=${ encodeURIComponent(
					currentLocation
			  ) }&page=my-jetpack#/add-jetpack-ai`;

	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( checkoutUrl );

	return {
		checkoutUrl,
		autosaveAndRedirect,
		isRedirecting,
	};
}
