import { useGlobalNotices } from '@automattic/jetpack-components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store } from '../../social-store';
import { startServiceConnect, type StartServiceConnectOptions } from '../../utils';

/**
 * Start a full-page OAuth redirect for a pure-OAuth service (no custom inputs). Reads the connect
 * URL from the services list, refetching once if it isn't loaded yet, then redirects the tab.
 *
 * @return Function that starts the connect; resolves to false if the URL couldn't be resolved.
 */
export function useConnectService() {
	const { createErrorNotice } = useGlobalNotices();
	const { refreshServicesList } = useDispatch( store );
	const { getService } = useSelect( select => select( store ), [] );

	return useCallback(
		async ( serviceId: string, options: StartServiceConnectOptions = {} ): Promise< boolean > => {
			let connectUrl = getService( serviceId )?.url;

			if ( ! connectUrl ) {
				await refreshServicesList();
				connectUrl = getService( serviceId )?.url;
			}

			if ( ! connectUrl ) {
				createErrorNotice(
					__(
						'Could not start the connection. Please refresh the page and try again.',
						'jetpack-publicize-pkg'
					)
				);

				return false;
			}

			startServiceConnect( connectUrl, serviceId, options );

			return true;
		},
		[ createErrorNotice, getService, refreshServicesList ]
	);
}
