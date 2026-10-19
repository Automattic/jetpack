import { useEffect, useState } from '@wordpress/element';
import { RETENTION_ARG, STORAGE_PURCHASED_ARG } from '../components/storage-space/checkout-url';
import { isRetentionOption, type RetentionDays } from '../data/api/backup-retention';

export type RetentionReturn = { days: RetentionDays; storagePurchased: boolean };

/**
 * The retention choice carried back from checkout, if any.
 *
 * Read once, then removed from the address so a reload or a later remount does not
 * reopen the dialog.
 *
 * @return The choice, and whether checkout reported a purchase.
 */
export function useRetentionReturn(): RetentionReturn | null {
	const [ pending ] = useState< RetentionReturn | null >( () => {
		const params = new URLSearchParams( window.location.search );
		const days = Number( params.get( RETENTION_ARG ) );

		return isRetentionOption( days )
			? { days, storagePurchased: params.get( STORAGE_PURCHASED_ARG ) === '1' }
			: null;
	} );

	useEffect( () => {
		const url = new URL( window.location.href );
		if (
			! url.searchParams.has( RETENTION_ARG ) &&
			! url.searchParams.has( STORAGE_PURCHASED_ARG )
		) {
			return;
		}

		url.searchParams.delete( RETENTION_ARG );
		url.searchParams.delete( STORAGE_PURCHASED_ARG );
		window.history.replaceState( window.history.state, '', url );
	}, [] );

	return pending;
}
