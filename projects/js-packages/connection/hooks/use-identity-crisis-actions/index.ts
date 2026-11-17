import restApi from '@automattic/jetpack-api';
import { useCallback, useState } from 'react';
import { isHttpUrl } from '../../helpers/is-http-url';
import { getIdentityCrisisErrorCause } from './get-error-cause';
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
 * @return The actions and their state.
 */
export default function useIdentityCrisisActions( {
	redirectUri,
}: UseIdentityCrisisActionsOptions = {} ): IdentityCrisisActions {
	const [ busyAction, setBusyAction ] = useState< IdentityCrisisAction | null >( null );
	const [ error, setError ] = useState< IdentityCrisisError | null >( null );
	const [ isMigrated, setIsMigrated ] = useState( false );

	const run = useCallback(
		async < T >(
			action: IdentityCrisisAction,
			request: () => Promise< T >
		): Promise< { response: T } | null > => {
			setBusyAction( action );
			setError( null );
			try {
				return { response: await request() };
			} catch ( caught ) {
				setError( { action, cause: getIdentityCrisisErrorCause( caught ) } );
				setBusyAction( null );
				return null;
			}
		},
		[]
	);

	const migrate = useCallback( async () => {
		const result = await run( 'migrate', () => restApi.migrateIDC() );
		if ( ! result ) {
			return false;
		}
		setBusyAction( null );
		setIsMigrated( true );
		return true;
	}, [ run ] );

	const startFresh = useCallback( async () => {
		const result = await run( 'start-fresh', async () => {
			const url: unknown = await restApi.startIDCFresh( redirectUri );
			// The host navigates to it, so anything but a web URL counts as a server failure.
			if ( ! isHttpUrl( url ) ) {
				throw new Error( 'Start fresh returned no connect URL' );
			}
			return url;
		} );
		return result ? result.response : null;
	}, [ run, redirectUri ] );

	const confirmSafeMode = useCallback( async () => {
		const result = await run( 'confirm-safe-mode', () => restApi.confirmIDCSafeMode() );
		return Boolean( result );
	}, [ run ] );

	const clearError = useCallback( () => setError( null ), [] );

	return { migrate, startFresh, confirmSafeMode, clearError, busyAction, error, isMigrated };
}
