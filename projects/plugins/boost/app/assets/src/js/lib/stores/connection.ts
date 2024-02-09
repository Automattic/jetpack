import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import api from '../api/api';
import { useModulesState } from '$features/module/lib/stores';
import { useCallback } from 'react';
import { z } from 'zod';

/**
 * Get the URL to upgrade boost.
 *
 * Ideally this function should not exist and
 * `getRedirectUrl( 'boost-plugin-upgrade-default', { site: domain, query, anchor: 'purchased' } )`
 * should be used instead. However, the redirect changes the redirect URL in a broken manner.
 *
 * @param domain
 * @param isUserConnected
 * @param blogID
 */
export function getUpgradeURL(
	domain: string,
	isUserConnected = false,
	blogID: string | null = null
) {
	const product = 'jetpack_boost_yearly';

	const checkoutProductUrl = new URL(
		`https://wordpress.com/checkout/${ blogID ?? domain }/${ product }`
	);

	// Add redirect_to parameter
	checkoutProductUrl.searchParams.set(
		'redirect_to',
		'admin.php?page=jetpack-boost#/purchase-successful'
	);

	// Add site to query string.
	checkoutProductUrl.searchParams.set( 'site', domain );

	// If not connected, add unlinked=1 to query string to tell wpcom to connect the site.
	if ( ! isUserConnected ) {
		checkoutProductUrl.searchParams.set( 'unlinked', '1' );
	}

	return checkoutProductUrl.toString();
}

const ConnectionSchema = z.object( {
	connected: z.boolean(),
	userConnected: z.boolean(),
	wpcomBlogId: z.number().nullable(),
} );

type ConnectionSchema = z.infer< typeof ConnectionSchema >;

export const useConnection = () => {
	const [ { data: connection, refetch } ] = useDataSync(
		'jetpack_boost_ds',
		'connection',
		ConnectionSchema
	);
	const [ { refetch: reloadModules } ] = useModulesState();

	return {
		connection,
		initializeConnection: useCallback( async () => {
			if ( connection?.connected ) {
				return;
			}
			return api.post( '/connection' ).then( results => {
				if ( results.connected ) {
					refetch();
					reloadModules();
				}
			} );
		}, [ connection?.connected, refetch, reloadModules ] ),
	};
};
