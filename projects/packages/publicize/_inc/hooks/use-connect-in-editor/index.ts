import { getAdminUrl } from '@automattic/jetpack-script-data';
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { store } from '../../social-store';

/**
 * Returns a function that opens the connect flow for a service on the Social admin page in a new
 * tab (used from the editor) and marks that service as connecting.
 *
 * @return A `(serviceId) => void` opener.
 */
export function useConnectInEditor() {
	const { setConnectingService } = useDispatch( store );

	return useCallback(
		( serviceId: string ) => {
			window.open(
				getAdminUrl(
					addQueryArgs( 'admin.php', {
						page: 'jetpack-social',
						connect: serviceId,
						source: 'editor',
					} )
				),
				'_blank'
			);
			setConnectingService( serviceId );
		},
		[ setConnectingService ]
	);
}
