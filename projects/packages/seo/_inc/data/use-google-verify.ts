import { getScriptData } from '@automattic/jetpack-script-data';
import requestExternalAccess from '@automattic/request-external-access';
import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import type { GoogleVerifyBootstrap, GoogleVerifyStatus } from './google-verify-types';

const ENDPOINT = '/jetpack/v4/verify-site/google';

type SeoScriptData = {
	seo?: {
		google_verify?: GoogleVerifyBootstrap;
	};
};

/**
 * Read the Google-verification bootstrap from `window.JetpackScriptData.seo.google_verify`.
 *
 * @return The bootstrap, or `null` when unavailable.
 */
export function getGoogleVerifyBootstrap(): GoogleVerifyBootstrap | null {
	const scriptData = getScriptData() as SeoScriptData | undefined;
	return scriptData?.seo?.google_verify ?? null;
}

/** `loading` while the initial status request is in flight; `unavailable` when disconnected. */
export type GoogleVerifyState = 'loading' | 'verified' | 'unverified' | 'unavailable';

export interface GoogleVerify {
	state: GoogleVerifyState;
	isConnected: boolean;
	isOwner: boolean;
	searchConsoleUrl: string;
	isVerifying: boolean;
	/** Open the WordPress.com keyring popup and verify with the returned keyring id. */
	autoVerify: () => void;
}

/**
 * Owns the Google auto-verify flow. On a connected site it fetches the live verified
 * status on mount, and `autoVerify()` opens the keyring OAuth popup and POSTs the
 * returned keyring id to verify the site — both via the existing
 * `/jetpack/v4/verify-site/google` endpoint. On a disconnected site there's no keyring,
 * so it reports `unavailable` and the UI falls back to manual code entry.
 *
 * @return The Google-verification controller.
 */
export function useGoogleVerify(): GoogleVerify {
	const bootstrap = useMemo( () => getGoogleVerifyBootstrap(), [] );
	const isConnected = bootstrap?.is_connected ?? false;
	const connectUrl = bootstrap?.connect_url ?? '';

	const [ state, setState ] = useState< GoogleVerifyState >(
		isConnected ? 'loading' : 'unavailable'
	);
	const [ isOwner, setIsOwner ] = useState( false );
	const [ searchConsoleUrl, setSearchConsoleUrl ] = useState( '' );
	const [ isVerifying, setIsVerifying ] = useState( false );

	const applyStatus = useCallback( ( status: GoogleVerifyStatus ) => {
		setState( status.verified ? 'verified' : 'unverified' );
		setIsOwner( !! status.is_owner );
		setSearchConsoleUrl( status.google_search_console_url ?? '' );
	}, [] );

	// Fetch the live verified status once, on a connected site.
	useEffect( () => {
		if ( ! isConnected ) {
			return undefined;
		}
		let cancelled = false;
		apiFetch< GoogleVerifyStatus >( { path: ENDPOINT } )
			.then( status => {
				if ( ! cancelled ) {
					applyStatus( status );
				}
			} )
			.catch( () => {
				// Treat a failed status check as "not verified" so the verify button
				// and manual fallback stay available.
				if ( ! cancelled ) {
					setState( 'unverified' );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ isConnected, applyStatus ] );

	const autoVerify = useCallback( () => {
		if ( ! connectUrl || isVerifying ) {
			return;
		}
		requestExternalAccess( connectUrl, ( keyringId: number | null ) => {
			if ( ! keyringId ) {
				return;
			}
			setIsVerifying( true );
			// POST verifies the site, then re-fetch the authoritative status: the
			// verify response doesn't reliably carry the final verified flag, so the
			// badge is driven by a follow-up status check (mirrors the legacy flow).
			apiFetch( {
				path: ENDPOINT,
				method: 'POST',
				data: { keyring_id: keyringId },
			} )
				.then( () => apiFetch< GoogleVerifyStatus >( { path: `${ ENDPOINT }/${ keyringId }` } ) )
				.then( applyStatus )
				.catch( () => setState( 'unverified' ) )
				.finally( () => setIsVerifying( false ) );
		} );
	}, [ connectUrl, isVerifying, applyStatus ] );

	return { state, isConnected, isOwner, searchConsoleUrl, isVerifying, autoVerify };
}
