/*
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { isSimpleSite, currentUserCan } from '@automattic/jetpack-script-data';
import {
	getJetpackAiManageUrl,
	isMyJetpackAvailable,
	useAutosaveAndRedirect,
} from '@automattic/jetpack-shared-extension-utils';
/*
 * Types
 */
import type { MouseEvent } from 'react';

export default function useAiProductPage(): {
	autosaveAndRedirect: ( event: MouseEvent< HTMLButtonElement > ) => void;
	isRedirecting: boolean;
	productPageUrl: string;
	isMyJetpackAvailable: boolean;
} {
	const isMyJetpackReallyAvailable = isMyJetpackAvailable() && ! isSimpleSite();
	// The Jetpack AI Hub needs manage_options; everyone else gets the public page.
	const productPageUrl =
		isMyJetpackReallyAvailable && currentUserCan( 'manage_options' )
			? getJetpackAiManageUrl()
			: getRedirectUrl( 'org-ai' );

	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( productPageUrl );

	return {
		productPageUrl,
		autosaveAndRedirect,
		isRedirecting,
		isMyJetpackAvailable: isMyJetpackReallyAvailable,
	};
}
