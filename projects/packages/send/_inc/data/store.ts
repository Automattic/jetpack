import { createReduxStore, register, select, useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { errorMessage, fetchStats, fetchStatus, postAction } from './api';
import { forgetOriginOptions } from './origin-options';
import { periodFromKey, periodKey } from './period';
import type { SendAction } from './api';
import type { LogRow, Period, SendStatus, Stats } from './types';

const STORE_NAME = 'jetpack-send';

type State = {
	status: SendStatus | null;
	/** Stats by `periodKey()`. */
	stats: Record< string, Stats >;
	/** The key of the stats that landed last, shown while another period loads. */
	lastStatsKey: string | null;
	/** Goes up each time this page logs an email, so lists of emails know to load again. */
	logVersion: number;
	/** Rows the Log has shown, by id, so its side panel can show one before the full email loads. */
	logRows: Record< string, LogRow >;
	/** An email the side panel asked the Log to delete, after the Log's own warning. */
	logDeleteRequest: LogRow | null;
};
type ReceiveStatusAction = { type: 'RECEIVE_STATUS'; status: SendStatus };
type ReceiveStatsAction = { type: 'RECEIVE_STATS'; key: string; stats: Stats };
type LogChangedAction = { type: 'LOG_CHANGED' };
type ReceiveLogRowsAction = { type: 'RECEIVE_LOG_ROWS'; rows: LogRow[] };
type LogDeleteRequestAction = { type: 'LOG_DELETE_REQUEST'; row: LogRow | null };
type StoreAction =
	| ReceiveStatusAction
	| ReceiveStatsAction
	| LogChangedAction
	| ReceiveLogRowsAction
	| LogDeleteRequestAction;

const INITIAL: State = {
	status: null,
	stats: {},
	lastStatsKey: null,
	logVersion: 0,
	logRows: {},
	logDeleteRequest: null,
};

export const sendStore = createReduxStore( STORE_NAME, {
	reducer: ( state: State = INITIAL, action: StoreAction ): State => {
		if ( action.type === 'RECEIVE_STATUS' ) {
			return { ...state, status: action.status };
		}
		if ( action.type === 'RECEIVE_STATS' ) {
			return {
				...state,
				stats: { ...state.stats, [ action.key ]: action.stats },
				lastStatsKey: action.key,
			};
		}
		if ( action.type === 'LOG_CHANGED' ) {
			return { ...state, logVersion: state.logVersion + 1 };
		}
		if ( action.type === 'RECEIVE_LOG_ROWS' ) {
			const logRows = { ...state.logRows };
			action.rows.forEach( row => ( logRows[ row.id ] = row ) );
			return { ...state, logRows };
		}
		if ( action.type === 'LOG_DELETE_REQUEST' ) {
			return { ...state, logDeleteRequest: action.row };
		}
		return state;
	},
	actions: {
		receiveStatus: ( status: SendStatus ): ReceiveStatusAction => ( {
			type: 'RECEIVE_STATUS',
			status,
		} ),
		receiveStats: ( key: string, stats: Stats ): ReceiveStatsAction => ( {
			type: 'RECEIVE_STATS',
			key,
			stats,
		} ),
		/**
		 * The log changed, e.g. a test or a resend was logged: lists and the Source filter's options
		 * load again and stats are read again, keeping what's on screen until the new numbers land.
		 *
		 * @return The thunk.
		 */
		logChanged:
			() =>
			( { dispatch } ) => {
				forgetOriginOptions();
				dispatch( { type: 'LOG_CHANGED' } );
				dispatch.invalidateResolutionForStoreSelector( 'getStats' );
			},
		receiveLogRows: ( rows: LogRow[] ): ReceiveLogRowsAction => ( {
			type: 'RECEIVE_LOG_ROWS',
			rows,
		} ),
		/**
		 * Ask the Log to delete an email (null clears the request once the Log has taken it).
		 *
		 * @param row - The email.
		 * @return The action.
		 */
		requestLogDelete: ( row: LogRow | null ): LogDeleteRequestAction => ( {
			type: 'LOG_DELETE_REQUEST',
			row,
		} ),
	},
	selectors: {
		getStatus: ( state: State ) => state.status,
		getStats: ( state: State, key: string ) => state.stats[ key ] ?? null,
		getLastStats: ( state: State ) =>
			state.lastStatsKey ? ( state.stats[ state.lastStatsKey ] ?? null ) : null,
		getLogVersion: ( state: State ) => state.logVersion,
		getLogRow: ( state: State, id: string ) => state.logRows[ id ] ?? null,
		getLogDeleteRequest: ( state: State ) => state.logDeleteRequest,
	},
	resolvers: {
		getStatus:
			() =>
			async ( { dispatch } ) => {
				dispatch.receiveStatus( await fetchStatus() );
			},
		getStats:
			( key: string ) =>
			async ( { dispatch } ) => {
				dispatch.receiveStats( key, await fetchStats( periodFromKey( key ) ) );
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

/**
 * Email activity for a period, fetched once per page and shared with the prefetch on Finish setup.
 * While another period loads, it keeps the last stats that landed and says it's `refreshing`,
 * so the card stays on screen; `stats` is null only before the first load.
 *
 * @param period - A preset or custom days.
 * @return Stats, a load error, a retry callback, and whether newer numbers are on the way.
 */
export function useStats( period: Period ) {
	const key = periodKey( period );
	const { stats, last, failed, resolving, resolutionError } = useSelect(
		storeSelect => {
			const store = storeSelect( sendStore );
			return {
				stats: store.getStats( key ),
				last: store.getLastStats(),
				failed: store.hasResolutionFailed( 'getStats', [ key ] ),
				resolving: store.isResolving( 'getStats', [ key ] ),
				resolutionError: store.getResolutionError( 'getStats', [ key ] ),
			};
		},
		[ key ]
	);
	const { invalidateResolution } = useDispatch( sendStore );
	const retry = useCallback(
		() => invalidateResolution( 'getStats', [ key ] ),
		[ invalidateResolution, key ]
	);
	const shown = stats ?? last;

	return {
		stats: shown,
		error: failed ? errorMessage( resolutionError ) : null,
		retry,
		refreshing: !! shown && ! failed && ( ! stats || resolving ),
	};
}

/**
 * A number that goes up each time this page logs an email; use it to load a list again.
 *
 * @return The log version.
 */
export function useLogVersion(): number {
	return useSelect( storeSelect => storeSelect( sendStore ).getLogVersion(), [] );
}
