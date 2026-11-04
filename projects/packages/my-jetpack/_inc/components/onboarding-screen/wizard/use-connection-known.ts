import { CONNECTION_STORE_ID } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';

/**
 * Whether the page's connection state has reached the store yet.
 *
 * Until it has, `useConnection()` reports every field as false, which reads the same
 * as a site nobody has connected.
 *
 * @return True once the connection is known.
 */
export function useConnectionKnown(): boolean {
	return useSelect(
		select =>
			typeof (
				select( CONNECTION_STORE_ID ) as {
					getConnectionStatus: () => { isRegistered?: unknown } | undefined;
				}
			 ).getConnectionStatus()?.isRegistered === 'boolean',
		[]
	);
}
