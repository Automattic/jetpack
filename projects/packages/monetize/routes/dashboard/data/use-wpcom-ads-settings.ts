import { isSimpleSite } from '@automattic/jetpack-script-data';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef } from 'react';
import { ADS_ACCOUNT_KEY, ADS_PAYOUT_KEY } from './ads-keys';
import { getSectionState } from './state';
import { wpcomFetch } from './wpcom-fetch';
import { PROXY_BASE } from './wpcom-request';
import type { WpcomApiError, WpcomRequest } from './wpcom-request';

export interface Payout {
	paypal: string;
	tosSigned: boolean;
}

interface WpcomAdsSettings {
	settings?: { paypal?: string; tos?: string };
}

export const WPCOM_ADS_SETTINGS: WpcomRequest = { api: 'wpcom/v2', path: 'wordads/settings' };
const SYNC_KEY = [ 'monetize', 'ads', 'sync' ];
// Waits for a burst of switch changes to settle, so WordPress.com gets one save.
const SYNC_DELAY = 2000;

const toPayout = ( { settings }: WpcomAdsSettings ): Payout => ( {
	paypal: settings?.paypal ?? '',
	tosSigned: settings?.tos === 'signed',
} );

const sync = () => apiFetch( { path: `${ PROXY_BASE }/ads/sync`, method: 'POST' } );

/**
 * Where ad earnings are paid, from WordPress.com.
 *
 * @param enabled - Whether to ask, which needs a user connected to WordPress.com.
 * @return The query.
 */
export function usePayout( enabled = true ) {
	return useQuery< Payout, WpcomApiError >( {
		queryKey: ADS_PAYOUT_KEY,
		queryFn: async () => toPayout( await wpcomFetch< WpcomAdsSettings >( WPCOM_ADS_SETTINGS ) ),
		enabled,
	} );
}

/** A payout save, and on Simple whether ads are off, which keeps the save from switching them on. */
type PayoutChange = { paypal?: string; tos: boolean; adsOff?: boolean };

/**
 * Save the PayPal address, the terms when first signed, or both.
 *
 * @return The mutation.
 */
export function useSavePayout() {
	const queryClient = useQueryClient();

	return useMutation< Payout, WpcomApiError, PayoutChange >( {
		mutationFn: async ( { paypal, tos, adsOff } ) =>
			toPayout(
				await wpcomFetch< WpcomAdsSettings >( {
					...WPCOM_ADS_SETTINGS,
					method: 'POST',
					data: {
						...( paypal ? { paypal } : {} ),
						...( tos ? { tos: 'signed' } : {} ),
						...( adsOff && isSimpleSite() ? { show_to_logged_in: 'pause' } : {} ),
					},
				} )
			),
		onSuccess: payout => {
			queryClient.setQueryData( ADS_PAYOUT_KEY, payout );
			// WordPress.com can update the Ads account along with the payout details.
			queryClient.invalidateQueries( { queryKey: ADS_ACCOUNT_KEY } );
		},
	} );
}

/**
 * Keep WordPress.com caught up with the site's Ads settings, as the connected user.
 *
 * Catches up once per page load if the server says WordPress.com is behind; failures wait for the next visit.
 *
 * @param canUseWpcom - Whether the current user is connected to WordPress.com.
 * @return Asks for a catch-up after the site's settings change.
 */
export function useWpcomAdsSync( canUseWpcom: boolean ) {
	// Simple sites keep their Ads settings on WordPress.com already.
	const enabled = canUseWpcom && ! isSimpleSite();
	const timer = useRef< ReturnType< typeof setTimeout > >( undefined );

	// A query, so remounting the tab doesn't act again on the state printed at load.
	useQuery( {
		queryKey: SYNC_KEY,
		queryFn: sync,
		enabled:
			enabled &&
			Boolean( getSectionState< { wpcomOutOfDate?: boolean } >( 'ads' )?.wpcomOutOfDate ),
		staleTime: Infinity,
		gcTime: Infinity,
		retry: false,
	} );

	// Send a pending catch-up now rather than drop it when leaving the Ads tab.
	useEffect(
		() => () => {
			if ( timer.current ) {
				clearTimeout( timer.current );
				sync().catch( () => undefined );
			}
		},
		[]
	);

	return useCallback( () => {
		if ( ! enabled ) {
			return;
		}
		clearTimeout( timer.current );
		timer.current = setTimeout( () => {
			timer.current = undefined;
			sync().catch( () => undefined );
		}, SYNC_DELAY );
	}, [ enabled ] );
}
