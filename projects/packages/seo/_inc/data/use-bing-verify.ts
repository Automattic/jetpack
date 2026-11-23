// PROTOTYPE (JPPROD-116): throwaway Bing copy of `use-google-verify`.
import { getScriptData } from '@automattic/jetpack-script-data';
import requestExternalAccess from '@automattic/request-external-access';
import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import type { BingVerifyBootstrap, BingVerifyStatus } from './bing-verify-types';

const ENDPOINT = '/jetpack/v4/verify-site/bing';
const NOTICE_ID = 'jetpack-seo-bing-verify';

// Short-circuits the chain when the site is already verified; the catch handler ignores it.
const ALREADY_VERIFIED = {};

type SeoScriptData = {
	seo?: {
		bing_verify?: BingVerifyBootstrap;
	};
};

/**
 * Read the Bing bootstrap from `window.JetpackScriptData.seo.bing_verify`.
 *
 * @return The bootstrap, or `null` when unavailable.
 */
export function getBingVerifyBootstrap(): BingVerifyBootstrap | null {
	const scriptData = getScriptData() as SeoScriptData | undefined;
	return scriptData?.seo?.bing_verify ?? null;
}

export type BingVerifyState = 'loading' | 'verified' | 'unverified' | 'unavailable';

export interface BingVerify {
	state: BingVerifyState;
	canAutoVerify: boolean;
	isOwner: boolean;
	webmasterToolsUrl: string;
	isVerifying: boolean;
	isConfirming: boolean;
	autoVerify: () => void;
}

/**
 * Connect the site to Bing Webmaster Tools through the host, keeping manual entry as a fallback.
 *
 * @param options          - Hook options.
 * @param options.saveCode - Persist the code before asking Bing to verify.
 * @return The Bing-verification controller.
 */
export function useBingVerify( {
	saveCode,
}: {
	saveCode: ( code: string ) => Promise< void >;
} ): BingVerify {
	const bootstrap = useMemo( () => getBingVerifyBootstrap(), [] );
	const connectUrl = bootstrap?.connect_url ?? '';
	const endpoint = bootstrap?.api_path ?? ENDPOINT;
	const canAutoVerify =
		( bootstrap?.can_auto_verify ?? bootstrap?.is_connected ?? false ) && !! connectUrl;

	const [ state, setState ] = useState< BingVerifyState >(
		canAutoVerify ? 'loading' : 'unavailable'
	);
	const [ isOwner, setIsOwner ] = useState( false );
	const [ webmasterToolsUrl, setWebmasterToolsUrl ] = useState( '' );
	const [ isVerifying, setIsVerifying ] = useState( false );
	const [ isConfirming, setIsConfirming ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const applyStatus = useCallback( ( status: BingVerifyStatus ) => {
		setState( status.verified ? 'verified' : 'unverified' );
		setIsOwner( !! status.is_owner );
		setWebmasterToolsUrl( status.webmaster_tools_url ?? '' );
	}, [] );

	useEffect( () => {
		if ( ! canAutoVerify ) {
			return undefined;
		}
		let cancelled = false;
		apiFetch< BingVerifyStatus >( { path: endpoint } )
			.then( status => {
				if ( ! cancelled ) {
					applyStatus( status );
				}
			} )
			.catch( ( error: unknown ) => {
				if ( cancelled ) {
					return;
				}
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
		setIsVerifying( true );
		requestExternalAccess( connectUrl, ( result: { keyring_id?: number } ) => {
			const keyringId = result?.keyring_id;
			if ( ! keyringId ) {
				setIsVerifying( false );
				return;
			}
			setIsConfirming( true );
			createInfoNotice( __( 'Connecting to Bing…', 'jetpack-seo' ), {
				id: NOTICE_ID,
				type: 'snackbar',
				isDismissible: false,
			} );
			// Same sequence as Google: get the code (the host adds the site to Bing first),
			// save it so the meta tag is served, ask Bing to verify, then re-read status.
			apiFetch< BingVerifyStatus >( { path: `${ endpoint }/${ keyringId }` } )
				.then( status => {
					if ( status.verified ) {
						applyStatus( status );
						createSuccessNotice( __( 'Your site is verified with Bing.', 'jetpack-seo' ), {
							id: NOTICE_ID,
							type: 'snackbar',
						} );
						throw ALREADY_VERIFIED;
					}
					if ( ! status.token ) {
						throw new Error(
							__(
								'Bing did not return a verification code for this account. Try another account, or enter a code manually.',
								'jetpack-seo'
							)
						);
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
				.then( () => apiFetch< BingVerifyStatus >( { path: `${ endpoint }/${ keyringId }` } ) )
				.then( status => {
					applyStatus( status );
					if ( status.verified ) {
						createSuccessNotice( __( 'Your site is verified with Bing.', 'jetpack-seo' ), {
							id: NOTICE_ID,
							type: 'snackbar',
						} );
					} else {
						createErrorNotice(
							__(
								"Bing couldn't verify this site. Try again, or enter a code manually.",
								'jetpack-seo'
							),
							{ id: NOTICE_ID, type: 'snackbar' }
						);
					}
				} )
				.catch( ( error: unknown ) => {
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
		createInfoNotice,
		createSuccessNotice,
		createErrorNotice,
	] );

	return {
		state,
		canAutoVerify,
		isOwner,
		webmasterToolsUrl,
		isVerifying,
		isConfirming,
		autoVerify,
	};
}
