import { getScriptData } from '@automattic/jetpack-script-data';
import requestExternalAccess from '@automattic/request-external-access';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { SiteVerifyService } from './site-verify-services';
import type { SiteVerifyBootstrap, SiteVerifyStatus } from './site-verify-types';

// Thrown to short-circuit the auto-verify promise chain when the site is already
// verified; the chain's catch handler ignores it so it is not treated as a failure.
const ALREADY_VERIFIED = {};

type SeoScriptData = {
	seo?: Partial< Record< SiteVerifyService[ 'scriptDataKey' ], SiteVerifyBootstrap > >;
};

/**
 * Read a service's verification bootstrap from `window.JetpackScriptData.seo`.
 *
 * @param service - The verification service.
 * @return The bootstrap, or `null` when unavailable.
 */
export function getSiteVerifyBootstrap( service: SiteVerifyService ): SiteVerifyBootstrap | null {
	const scriptData = getScriptData() as SeoScriptData | undefined;
	return scriptData?.seo?.[ service.scriptDataKey ] ?? null;
}

/** `loading` while the initial status request is in flight; `unavailable` when disconnected. */
export type SiteVerifyState = 'loading' | 'verified' | 'unverified' | 'unavailable';

export interface SiteVerify {
	state: SiteVerifyState;
	canAutoVerify: boolean;
	isOwner: boolean;
	/** Link to the service's own dashboard, such as Google Search Console. */
	toolsUrl: string;
	isVerifying: boolean;
	/** The popup returned a keyring, and the token is being saved and checked. */
	isConfirming: boolean;
	/** Open the WordPress.com keyring popup and verify with the returned keyring id. */
	autoVerify: () => void;
}

/**
 * Verify through the host's transport, retaining manual entry when unavailable.
 *
 * @param service          - The verification service.
 * @param options          - Hook options.
 * @param options.saveCode - Persist the token before asking the service to verify.
 * @return The site-verification controller.
 */
export function useSiteVerify(
	service: SiteVerifyService,
	{
		saveCode,
	}: {
		saveCode: ( code: string ) => Promise< void >;
	}
): SiteVerify {
	const bootstrap = useMemo( () => getSiteVerifyBootstrap( service ), [ service ] );
	const connectUrl = bootstrap?.connect_url ?? '';
	const endpoint = bootstrap?.api_path ?? service.endpoint;
	const canAutoVerify =
		( bootstrap?.can_auto_verify ?? bootstrap?.is_connected ?? false ) && !! connectUrl;
	const { noticeId, strings, toolsUrlField } = service;

	const [ state, setState ] = useState< SiteVerifyState >(
		canAutoVerify ? 'loading' : 'unavailable'
	);
	const [ isOwner, setIsOwner ] = useState( false );
	const [ toolsUrl, setToolsUrl ] = useState( '' );
	const [ isVerifying, setIsVerifying ] = useState( false );
	const [ isConfirming, setIsConfirming ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const applyStatus = useCallback(
		( status: SiteVerifyStatus ) => {
			setState( status.verified ? 'verified' : 'unverified' );
			setIsOwner( !! status.is_owner );
			setToolsUrl( status[ toolsUrlField ] ?? '' );
		},
		[ toolsUrlField ]
	);

	// Read status only when the host supplies a usable verification flow.
	useEffect( () => {
		if ( ! canAutoVerify ) {
			return undefined;
		}
		let cancelled = false;
		apiFetch< SiteVerifyStatus >( { path: endpoint } )
			.then( status => {
				if ( ! cancelled ) {
					applyStatus( status );
				}
			} )
			.catch( ( error: unknown ) => {
				if ( cancelled ) {
					return;
				}
				// A missing route during deployment or forbidden access keeps manual entry available.
				const code = ( error as { code?: string } )?.code;
				setState(
					[ 'forbidden', 'rest_forbidden', 'rest_no_route' ].includes( code ?? '' )
						? 'unavailable'
						: 'unverified'
				);
			} );
		return () => {
			cancelled = true;
		};
	}, [ canAutoVerify, endpoint, applyStatus ] );

	const autoVerify = useCallback( () => {
		if ( ! canAutoVerify || state === 'unavailable' || isVerifying ) {
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
			setIsConfirming( true );
			createInfoNotice( strings.verifying, {
				id: noticeId,
				type: 'snackbar',
				isDismissible: false,
			} );
			// The auto-verify flow is: (1) fetch the verification token for this keyring,
			// (2) save it to `verification_services_codes` so the site serves the service's
			// meta tag, (3) ask the service to verify (it fetches the tag), (4) re-read the
			// authoritative status. Skipping step 2 fails because the tag isn't on the site.
			apiFetch< SiteVerifyStatus >( { path: `${ endpoint }/${ keyringId }` } )
				.then( status => {
					if ( status.verified ) {
						// Already verified: report it and skip the save/verify round-trips.
						applyStatus( status );
						createSuccessNotice( strings.verified, { id: noticeId, type: 'snackbar' } );
						throw ALREADY_VERIFIED;
					}
					if ( ! status.token ) {
						// Without a token the meta tag cannot be served, so verification
						// cannot proceed; surface it as an actionable error.
						throw new Error( strings.noToken );
					}
					return saveCode( status.token );
				} )
				.then( () =>
					apiFetch( {
						path: endpoint,
						method: 'POST',
						data: { keyring_id: keyringId },
					} )
				)
				.then( () => apiFetch< SiteVerifyStatus >( { path: `${ endpoint }/${ keyringId }` } ) )
				.then( status => {
					applyStatus( status );
					if ( status.verified ) {
						createSuccessNotice( strings.verified, { id: noticeId, type: 'snackbar' } );
					} else {
						createErrorNotice( strings.notVerified, { id: noticeId, type: 'snackbar' } );
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
						{ id: noticeId, type: 'snackbar' }
					);
				} )
				.finally( () => {
					setIsConfirming( false );
					setIsVerifying( false );
				} );
		} );
	}, [
		connectUrl,
		endpoint,
		canAutoVerify,
		state,
		isVerifying,
		applyStatus,
		saveCode,
		noticeId,
		strings,
		createInfoNotice,
		createSuccessNotice,
		createErrorNotice,
	] );

	return {
		state,
		canAutoVerify,
		isOwner,
		toolsUrl,
		isVerifying,
		isConfirming,
		autoVerify,
	};
}
