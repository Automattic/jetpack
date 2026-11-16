import restApi from '@automattic/jetpack-api';
import { useCallback, useState } from 'react';
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
		async (
			action: IdentityCrisisAction,
			request: () => Promise< unknown >
		): Promise< { response: unknown } | null > => {
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
		const result = await run( 'start-fresh', () => restApi.startIDCFresh( redirectUri ) );
		if ( ! result ) {
			return null;
		}
		if ( typeof result.response !== 'string' || ! result.response ) {
			setError( { action: 'start-fresh', cause: 'server' } );
			setBusyAction( null );
			return null;
		}
		return result.response;
	}, [ run, redirectUri ] );

	const confirmSafeMode = useCallback( async () => {
		const result = await run( 'confirm-safe-mode', () => restApi.confirmIDCSafeMode() );
		setBusyAction( null );
		return Boolean( result );
	}, [ run ] );

	return { migrate, startFresh, confirmSafeMode, busyAction, error, isMigrated };
}
