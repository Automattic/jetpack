/*
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { isSimpleSite } from '@automattic/jetpack-script-data';
import {
	getJetpackData,
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
	const productPageUrl = isMyJetpackReallyAvailable
		? `${ getJetpackData()?.adminUrl || '' }admin.php?page=my-jetpack#/jetpack-ai`
		: getRedirectUrl( 'org-ai' );

	const { autosaveAndRedirect, isRedirecting } = useAutosaveAndRedirect( productPageUrl );

	return {
		productPageUrl,
		autosaveAndRedirect,
		isRedirecting,
		isMyJetpackAvailable: isMyJetpackReallyAvailable,
	};
}
