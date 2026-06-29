import { getScriptData } from '@automattic/jetpack-script-data';
import requestExternalAccess from '@automattic/request-external-access';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { GoogleVerifyBootstrap, GoogleVerifyStatus } from './google-verify-types';

const ENDPOINT = '/jetpack/v4/verify-site/google';
// Single snackbar id reused across a verify so the "Verifying…" toast is replaced
// in place by the result.
const NOTICE_ID = 'jetpack-seo-google-verify';

// Thrown to short-circuit the auto-verify promise chain when the site is already
// verified; the chain's catch handler ignores it so it is not treated as a failure.
const ALREADY_VERIFIED = {};

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
 * @param options             - Hook options.
 * @param options.onCodeSaved - Called with the verification code once auto-verify
 *                            persists it, so the consumer can mirror it into form
 *                            state (e.g. to keep a "configured" badge in sync).
 * @return The Google-verification controller.
 */
export function useGoogleVerify( {
	onCodeSaved,
}: { onCodeSaved?: ( code: string ) => void } = {} ): GoogleVerify {
	const bootstrap = useMemo( () => getGoogleVerifyBootstrap(), [] );
	const isConnected = bootstrap?.is_connected ?? false;
	const connectUrl = bootstrap?.connect_url ?? '';

	const [ state, setState ] = useState< GoogleVerifyState >(
		isConnected ? 'loading' : 'unavailable'
	);
	const [ isOwner, setIsOwner ] = useState( false );
	const [ searchConsoleUrl, setSearchConsoleUrl ] = useState( '' );
	const [ isVerifying, setIsVerifying ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

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
			.catch( ( error: unknown ) => {
				if ( cancelled ) {
					return;
				}
				// A `forbidden` status (e.g. the site is under construction) means
				// auto-verify is blocked, so fall back to manual entry only. Any other
				// failure leaves the verify button and manual fallback available.
				const code = ( error as { code?: string } )?.code;
				setState( code === 'forbidden' ? 'unavailable' : 'unverified' );
			} );
		return () => {
			cancelled = true;
		};
	}, [ isConnected, applyStatus ] );

	const autoVerify = useCallback( () => {
		if ( ! connectUrl || isVerifying ) {
			return;
		}
		// Mark the flow in progress *before* opening the popup. The Verify button is
		// disabled on `isVerifying`; setting it only after the popup returns would leave
		// the button clickable while the popup is open, letting a user open overlapping
		// verify flows.
		setIsVerifying( true );
		// `@automattic/request-external-access` invokes the callback with a RESULT
		// OBJECT ({ keyring_id, id_token, user }) — NOT a bare keyring id like the
		// legacy `lib/sharing` helper did. Pull the id out; it's absent when the user
		// closes the popup without authorizing.
		requestExternalAccess( connectUrl, ( result: { keyring_id?: number } ) => {
			const keyringId = result?.keyring_id;
			if ( ! keyringId ) {
				// Popup closed without authorizing — re-enable the button.
				setIsVerifying( false );
				return;
			}
			createInfoNotice( __( 'Verifying with Google…', 'jetpack-seo' ), {
				id: NOTICE_ID,
				type: 'snackbar',
				isDismissible: false,
			} );
			let savedToken = '';
			// The auto-verify flow is: (1) fetch the verification token for this keyring,
			// (2) save it to `verification_services_codes.google` so the site serves the
			// `google-site-verification` meta tag, (3) ask Google to verify (it fetches the
			// tag), (4) re-read the authoritative status. Skipping step 2 fails with
			// "the necessary verification token could not be found on your site".
			apiFetch< GoogleVerifyStatus >( { path: `${ ENDPOINT }/${ keyringId }` } )
				.then( status => {
					if ( status.verified ) {
						// Already verified: report it and skip the save/verify round-trips.
						applyStatus( status );
						createSuccessNotice( __( 'Your site is verified with Google.', 'jetpack-seo' ), {
							id: NOTICE_ID,
							type: 'snackbar',
						} );
						throw ALREADY_VERIFIED;
					}
					if ( ! status.token ) {
						// Without a token the meta tag cannot be served, so verification
						// cannot proceed; surface it as an actionable error.
						throw new Error(
							__(
								'Google did not return a verification token for this account. Try another account, or enter a code manually.',
								'jetpack-seo'
							)
						);
					}
					savedToken = status.token;
					return apiFetch( {
						path: '/jetpack/v4/settings',
						method: 'POST',
						data: { google: status.token },
					} );
				} )
				.then( () => {
					// The code is now persisted to `verification_services_codes.google`;
					// mirror it into the consumer's form state so the verification card's
					// "configured" badge updates without a reload.
					onCodeSaved?.( savedToken );
					return apiFetch( {
						path: ENDPOINT,
						method: 'POST',
						data: { keyring_id: keyringId },
					} );
				} )
				.then( () => apiFetch< GoogleVerifyStatus >( { path: `${ ENDPOINT }/${ keyringId }` } ) )
				.then( status => {
					applyStatus( status );
					if ( status.verified ) {
						createSuccessNotice( __( 'Your site is verified with Google.', 'jetpack-seo' ), {
							id: NOTICE_ID,
							type: 'snackbar',
						} );
					} else {
						createErrorNotice(
							__(
								"Google couldn't verify this site. Make sure the Google account you used has access to it in Search Console.",
								'jetpack-seo'
							),
							{ id: NOTICE_ID, type: 'snackbar' }
						);
					}
				} )
				.catch( ( error: unknown ) => {
					// The already-verified short-circuit throws a sentinel; that is a
					// success path, so leave the state and notice it set in place.
					if ( error === ALREADY_VERIFIED ) {
						return;
					}
					setState( 'unverified' );
					createErrorNotice(
						( error as { message?: string } )?.message ??
							__( 'Could not verify the site. Please try again.', 'jetpack-seo' ),
						{ id: NOTICE_ID, type: 'snackbar' }
					);
				} )
				.finally( () => setIsVerifying( false ) );
		} );
	}, [
		connectUrl,
		isVerifying,
		applyStatus,
		onCodeSaved,
		createInfoNotice,
		createSuccessNotice,
		createErrorNotice,
	] );

	return { state, isConnected, isOwner, searchConsoleUrl, isVerifying, autoVerify };
}
