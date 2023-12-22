import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import api from '../api/api';
import { configSchema } from './config-ds';
import { useModulesState } from '$features/module/lib/stores';
import { useCallback } from 'react';
import { z } from 'zod';

/**
 * Get the URL to upgrade boost.
 *
 * Ideally this function should not exist and
 * `getRedirectUrl( 'boost-plugin-upgrade-default', { site: config.site.domain, query, anchor: 'purchased' } )`
 * should be used instead. However, the redirect changes the redirect URL in a broken manner.
 *
 * @param domain
 * @param isUserConnected
 */
export function getUpgradeURL( domain: string, isUserConnected = false ) {
	const product = 'jetpack_boost_yearly';

	const redirectUrl = new URL( window.location.href );
	redirectUrl.hash = '#/purchase-successful';

	const checkoutProductUrl = new URL( `https://wordpress.com/checkout/${ domain }/${ product }` );

	// Add redirect_to parameter
	checkoutProductUrl.searchParams.set( 'redirect_to', redirectUrl.toString() );

	// Add site to query string.
	checkoutProductUrl.searchParams.set( 'site', domain );

	// If not connected, add unlinked=1 to query string to tell wpcom to connect the site.
	if ( ! isUserConnected ) {
		checkoutProductUrl.searchParams.set( 'unlinked', '1' );
	}

	return checkoutProductUrl.toString();
}

export const useConnection = () => {
	const [ { data, refetch: reloadConfig } ] = useDataSync(
		'jetpack_boost_ds',
		'config',
		configSchema
	);
	const [ { refetch: reloadModules } ] = useModulesState();

	const connection = data?.connection as z.infer< typeof configSchema >[ 'connection' ];

	return {
		connection,
		initializeConnection: useCallback( async () => {
			if ( connection?.connected ) {
				return;
			}
			return api.post( '/connection' ).then( results => {
				if ( results.connected ) {
					reloadConfig();
					reloadModules();
				}
			} );
		}, [ connection, reloadConfig, reloadModules ] ),
	};
};
