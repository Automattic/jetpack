import { createReduxStore, register, select, useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { errorMessage, fetchStatus, postAction } from './api';
import type { SendAction } from './api';
import type { SendStatus } from './types';

const STORE_NAME = 'jetpack-send';

type State = { status: SendStatus | null };
type ReceiveStatusAction = { type: 'RECEIVE_STATUS'; status: SendStatus };

export const sendStore = createReduxStore( STORE_NAME, {
	reducer: ( state: State = { status: null }, action: ReceiveStatusAction ): State =>
		action.type === 'RECEIVE_STATUS' ? { status: action.status } : state,
	actions: {
		receiveStatus: ( status: SendStatus ): ReceiveStatusAction => ( {
			type: 'RECEIVE_STATUS',
			status,
		} ),
	},
	selectors: {
		getStatus: ( state: State ) => state.status,
	},
	resolvers: {
		getStatus:
			() =>
			async ( { dispatch } ) => {
				dispatch.receiveStatus( await fetchStatus() );
			},
	},
} );

// Each route bundles its own copy of this module; a second register() would log an error.
if ( ! select( STORE_NAME ) ) {
	register( sendStore );
}

/**
 * The dashboard status, resolved from the page preload on first read.
 *
 * @return Status, a load error, and a retry callback.
 */
export function useSendStatus() {
	const { status, failed, resolutionError } = useSelect( storeSelect => {
		const store = storeSelect( sendStore );
		return {
			status: store.getStatus(),
			failed: store.hasResolutionFailed( 'getStatus', [] ),
			resolutionError: store.getResolutionError( 'getStatus', [] ),
		};
	}, [] );
	const { invalidateResolution } = useDispatch( sendStore );
	const retry = useCallback(
		() => invalidateResolution( 'getStatus', [] ),
		[ invalidateResolution ]
	);

	return { status, error: failed ? errorMessage( resolutionError ) : null, retry };
}

/**
 * Run a status-returning POST and store the result.
 *
 * @return The runner, the action in flight, and the last error.
 */
export function useSendAction() {
	const { receiveStatus } = useDispatch( sendStore );
	const [ busy, setBusy ] = useState< SendAction | null >( null );
	const [ error, setError ] = useState< string | null >( null );

	const run = useCallback(
		async ( action: SendAction, data?: Record< string, unknown > ) => {
			setBusy( action );
			setError( null );
			try {
				const status = await postAction( action, data );
				receiveStatus( status );
				return status;
			} catch ( e ) {
				setError( errorMessage( e ) );
				return null;
			} finally {
				setBusy( null );
			}
		},
		[ receiveStatus ]
	);

	return { run, busy, error };
}
