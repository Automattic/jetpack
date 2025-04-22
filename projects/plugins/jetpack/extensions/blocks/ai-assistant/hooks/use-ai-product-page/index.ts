/*
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { getJetpackData, useAutosaveAndRedirect } from '@automattic/jetpack-shared-extension-utils';
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
	// TODO: use isMyJetpackAvailable from shared-extension-utils once PR is merged and package published:
	// https://github.com/Automattic/jetpack/pull/38529
	const isMyJetpackAvailable = getJetpackData()?.jetpack?.is_my_jetpack_available;
	const productPageUrl = isMyJetpackAvailable
		? `${ getJetpackData()?.adminUrl || '' }admin.php?page=my-jetpack#/jetpack-ai`
		: getRedirectUrl( 'org-ai' );

	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( productPageUrl );

	return {
		productPageUrl,
		autosaveAndRedirect,
		isRedirecting,
		isMyJetpackAvailable,
	};
}
