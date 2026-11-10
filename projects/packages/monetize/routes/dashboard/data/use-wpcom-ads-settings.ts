import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useRef } from 'react';
import { getSectionState } from './state';
import { PROXY_BASE, toWpcomApiError } from './wpcom-request';
import type { WpcomApiError } from './wpcom-request';
import type { APIFetchOptions } from '@wordpress/api-fetch';

export interface Payout {
	paypal: string;
	tosSigned: boolean;
}

const PAYOUT_PATH = `${ PROXY_BASE }/ads/payout`;
const SYNC_PATH = `${ PROXY_BASE }/ads/sync`;
const PAYOUT_KEY = [ 'monetize', 'ads', 'payout' ];
// Waits for a burst of switch changes to settle, so WordPress.com gets one save.
const SYNC_DELAY = 2000;

const request = async < T >( options: APIFetchOptions< true > ) => {
	try {
		return await apiFetch< T >( options );
	} catch ( error ) {
		throw toWpcomApiError( error );
	}
};

/**
 * Where ad earnings are paid, from WordPress.com.
 *
 * @return The query.
 */
export function usePayout() {
	return useQuery< Payout, WpcomApiError >( {
		queryKey: PAYOUT_KEY,
		queryFn: () => request< Payout >( { path: PAYOUT_PATH } ),
	} );
}

/**
 * Save the PayPal address, and the terms when first signed. The site's Ads settings go with them.
 *
 * @return The mutation.
 */
export function useSavePayout() {
	const queryClient = useQueryClient();

	return useMutation< Payout, WpcomApiError, { paypal: string; tos: boolean } >( {
		mutationFn: data => request< Payout >( { path: PAYOUT_PATH, method: 'POST', data } ),
		onSuccess: payout => queryClient.setQueryData( PAYOUT_KEY, payout ),
	} );
}

/**
 * Keep WordPress.com caught up with the site's Ads settings, as the connected user.
 *
 * Catches up once on load if the server says WordPress.com is behind; failures wait for the next visit.
 *
 * @param canUseWpcom - Whether the current user is connected to WordPress.com.
 * @return Asks for a catch-up after the site's settings change.
 */
export function useWpcomAdsSync( canUseWpcom: boolean ) {
	const timer = useRef< ReturnType< typeof setTimeout > >( undefined );
	const { mutate } = useMutation( {
		mutationFn: () => request( { path: SYNC_PATH, method: 'POST' } ),
	} );

	useEffect( () => {
		if ( canUseWpcom && getSectionState< { wpcomOutOfDate?: boolean } >( 'ads' )?.wpcomOutOfDate ) {
			mutate();
		}
	}, [ canUseWpcom, mutate ] );

	useEffect( () => () => clearTimeout( timer.current ), [] );

	return useCallback( () => {
		if ( ! canUseWpcom ) {
			return;
		}
		clearTimeout( timer.current );
		timer.current = setTimeout( () => mutate(), SYNC_DELAY );
	}, [ canUseWpcom, mutate ] );
}
