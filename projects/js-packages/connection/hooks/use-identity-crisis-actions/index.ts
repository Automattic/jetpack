import restApi from '@automattic/jetpack-api';
import { dispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from 'react';
import { isHttpUrl } from '../../helpers/is-http-url';
import STORE_ID from '../../state/store-id';
import { getIdentityCrisisErrorCause, getIdentityCrisisErrorCode } from './get-error-cause';
import type {
	IdentityCrisisAction,
	IdentityCrisisActions,
	IdentityCrisisError,
	UseIdentityCrisisActionsOptions,
} from './types';

/**
 * The three Safe Mode resolutions, without navigation or tracking: the host decides what follows.
 *
 * Requests go through `@automattic/jetpack-api`, whose root and nonce the connection store sets.
 *
 * @param options             - Hook options.
 * @param options.redirectUri - Admin path to return to after a fresh connection.
 * @param options.from        - Name from `CONNECTION_FROM`, reported to WordPress.com with a fresh connection.
 * @return The actions and their state.
 */
export default function useIdentityCrisisActions( {
	redirectUri,
	from,
}: UseIdentityCrisisActionsOptions = {} ): IdentityCrisisActions {
	const [ busyAction, setBusyAction ] = useState< IdentityCrisisAction | null >( null );
	const [ error, setError ] = useState< IdentityCrisisError | null >( null );
	const [ isMigrated, setIsMigrated ] = useState( false );
	const [ isDisconnected, setIsDisconnected ] = useState( false );
	const [ isResolved, setIsResolved ] = useState( false );
	// State updates on the next render, so a second call in the same tick would still see it unset.
	const busyRef = useRef< IdentityCrisisAction | null >( null );

	const setBusy = useCallback( ( action: IdentityCrisisAction | null ) => {
		busyRef.current = action;
		setBusyAction( action );
	}, [] );

	const run = useCallback(
		async < T >(
			action: IdentityCrisisAction,
			request: () => Promise< T >
		): Promise< { response: T } | null > => {
			if ( busyRef.current ) {
				return null;
			}
			setBusy( action );
			setError( null );
			try {
				return { response: await request() };
			} catch ( caught ) {
				const cause = getIdentityCrisisErrorCause( caught );
				// Optional: an older copy of the store, or none, may be registered.
				const store = dispatch( STORE_ID ) as
					| { setIdentityCrisisDisconnected?: () => void; setIdentityCrisisResolved?: () => void }
					| undefined;
				if ( cause === 'disconnected' ) {
					setIsDisconnected( true );
					store?.setIdentityCrisisDisconnected?.();
				} else if ( cause === 'resolved' ) {
					setIsResolved( true );
					store?.setIdentityCrisisResolved?.();
				}
				setError( { action, cause, code: getIdentityCrisisErrorCode( caught ) } );
				setBusy( null );
				return null;
			}
		},
		[ setBusy ]
	);

	// Each action takes an `IdentityCrisisActionPath` for CONNECT-620's events; nothing reads it yet.
	const migrate: IdentityCrisisActions[ 'migrate' ] = useCallback( async () => {
		const result = await run( 'migrate', () => restApi.migrateIDC() );
		if ( ! result ) {
			return false;
		}
		setBusy( null );
		setIsMigrated( true );
		return true;
	}, [ run, setBusy ] );

	const startFresh: IdentityCrisisActions[ 'startFresh' ] = useCallback( async () => {
		const result = await run( 'start-fresh', async () => {
			const url: unknown = await restApi.startIDCFresh( redirectUri, from );
			// The host navigates to it, so anything but a web URL counts as a server failure.
			if ( ! isHttpUrl( url ) ) {
				const invalid = new Error( 'Start fresh returned no connect URL' );
				invalid.name = 'InvalidConnectUrl';
				throw invalid;
			}
			return url;
		} );
		return result ? result.response : null;
	}, [ run, redirectUri, from ] );

	const confirmSafeMode: IdentityCrisisActions[ 'confirmSafeMode' ] = useCallback( async () => {
		const result = await run( 'confirm-safe-mode', () => restApi.confirmIDCSafeMode() );
		return Boolean( result );
	}, [ run ] );

	const clearError = useCallback( () => setError( null ), [] );

	return {
		migrate,
		startFresh,
		confirmSafeMode,
		clearError,
		busyAction,
		error,
		isMigrated,
		isDisconnected,
		isResolved,
	};
}
