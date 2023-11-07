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

export default function useAICheckout(): {
	checkoutUrl: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	autosaveAndRedirect: ( event: any ) => void;
	isRedirecting: boolean;
} {
	const wpcomCheckoutUrl = getRedirectUrl( 'jetpack-ai-monthly-plan-ai-assistant-block-banner', {
		site: getSiteFragment(),
	} );

	const checkoutUrl =
		isAtomicSite() || isSimpleSite()
			? wpcomCheckoutUrl
			: `${ window?.Jetpack_Editor_Initial_State?.adminUrl }admin.php?page=my-jetpack#/add-jetpack-ai`;

	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( checkoutUrl );

	return {
		checkoutUrl,
		autosaveAndRedirect,
		isRedirecting,
	};
}
