import { createReduxStore, register } from '@wordpress/data';
import { fetchServices, fetchSettings, fetchStatus } from './api';
import * as writes from './writes';
import type { Services, Settings, SharingLikesScriptData, Status } from '../types';

export const STORE_NAME = 'jetpack-sharing-likes/settings';

export type Slice = 'status' | 'settings' | 'services';

export type WriteKind = 'setting' | 'services' | 'custom-service' | 'feature-action';

interface Slices {
	status: Status;
	settings: Settings;
	services: Services;
}

export interface State {
	status?: Status;
	settings?: Settings;
	services?: Services;
	// Bumped by every local change to a slice, so a read that started before it is dropped when it lands.
	versions: Record< Slice, number >;
	// Writes queued or in flight, by kind.
	pending: Record< WriteKind, number >;
}

type Action =
	| { type: 'RECEIVE'; slice: Slice; value: Slices[ Slice ]; since?: number }
	| { type: 'DISCARD_READS'; slice: Slice }
	| { type: 'WRITE_STARTED' | 'WRITE_SETTLED'; kind: WriteKind };

const DEFAULT_STATE: State = {
	versions: { status: 0, settings: 0, services: 0 },
	pending: { setting: 0, services: 0, 'custom-service': 0, 'feature-action': 0 },
};

/**
 * Store reducer.
 *
 * @param state  - State.
 * @param action - Action.
 * @return New state.
 */
function reducer( state: State = DEFAULT_STATE, action: Action ): State {
	switch ( action.type ) {
		case 'RECEIVE':
			if ( action.since === undefined ) {
				return {
					...state,
					[ action.slice ]: action.value,
					versions: { ...state.versions, [ action.slice ]: state.versions[ action.slice ] + 1 },
				};
			}
			return action.since === state.versions[ action.slice ]
				? { ...state, [ action.slice ]: action.value }
				: state;
		case 'DISCARD_READS':
			return {
				...state,
				versions: { ...state.versions, [ action.slice ]: state.versions[ action.slice ] + 1 },
			};
		case 'WRITE_STARTED':
		case 'WRITE_SETTLED':
			return {
				...state,
				pending: {
					...state.pending,
					[ action.kind ]:
						state.pending[ action.kind ] + ( action.type === 'WRITE_STARTED' ? 1 : -1 ),
				},
			};
		default:
			return state;
	}
}

const actions = {
	/**
	 * Store a slice. Without `since` it is a local change; with it, a read that started at that version.
	 *
	 * @param slice - Slice.
	 * @param value - Value.
	 * @param since - The slice's version when the read started.
	 * @return Action.
	 */
	receive< S extends Slice >( slice: S, value: Slices[ S ], since?: number ): Action {
		return { type: 'RECEIVE', slice, value, since };
	},

	/**
	 * Drop whatever reads of a slice are in flight when they land.
	 *
	 * @param slice - Slice.
	 * @return Action.
	 */
	discardReads( slice: Slice ): Action {
		return { type: 'DISCARD_READS', slice };
	},

	/**
	 * Count a write as queued.
	 *
	 * @param kind - Write kind.
	 * @return Action.
	 */
	writeStarted( kind: WriteKind ): Action {
		return { type: 'WRITE_STARTED', kind };
	},

	/**
	 * Count a write as done.
	 *
	 * @param kind - Write kind.
	 * @return Action.
	 */
	writeSettled( kind: WriteKind ): Action {
		return { type: 'WRITE_SETTLED', kind };
	},

	/**
	 * Start from the script data, so the first render waits on no request.
	 *
	 * @param scriptData - The page's script data.
	 * @return Thunk.
	 */
	seed:
		( scriptData: Pick< SharingLikesScriptData, 'status' | 'settings' > ) =>
		( { dispatch }: { dispatch: ThunkDispatch } ) => {
			dispatch.receive( 'status', scriptData.status );
			dispatch.receive( 'settings', scriptData.settings );
			dispatch.finishResolution( 'getStatus', [] );
			dispatch.finishResolution( 'getSettings', [] );
		},

	...writes,
};

const selectors = {
	/**
	 * Which variant each section renders.
	 *
	 * @param state - State.
	 * @return Status, once known.
	 */
	getStatus: ( state: State ): Status | undefined => state.status,

	/**
	 * Every setting the screen shows on this site.
	 *
	 * @param state - State.
	 * @return Settings, once known.
	 */
	getSettings: ( state: State ): Settings | undefined => state.settings,

	/**
	 * The enabled services.
	 *
	 * @param state - State.
	 * @return Services, once known.
	 */
	getServices: ( state: State ): Services | undefined => state.services,

	/**
	 * Writes queued or in flight.
	 *
	 * @param state - State.
	 * @param kind  - Only this kind, or every write.
	 * @return Count.
	 */
	getPendingWrites: ( state: State, kind?: WriteKind ): number =>
		kind
			? state.pending[ kind ]
			: Object.values( state.pending ).reduce( ( sum, count ) => sum + count, 0 ),

	/**
	 * A slice's version, which every local change bumps.
	 *
	 * @param state - State.
	 * @param slice - Slice.
	 * @return Version.
	 */
	getVersion: ( state: State, slice: Slice ): number => state.versions[ slice ],
};

/**
 * A resolver that stores what it read unless the slice changed locally meanwhile.
 *
 * @param slice - Slice.
 * @param fetch - Request.
 * @return Resolver.
 */
function read< S extends Slice >( slice: S, fetch: () => Promise< Slices[ S ] > ) {
	return () =>
		async ( { select, dispatch }: { select: ThunkSelect; dispatch: ThunkDispatch } ) => {
			const since = select.getVersion( slice );
			dispatch.receive( slice, await fetch(), since );
		};
}

const resolvers = {
	getStatus: read( 'status', fetchStatus ),
	getSettings: read( 'settings', fetchSettings ),
	getServices: read( 'services', fetchServices ),
};

export type ThunkSelect = {
	[ K in keyof typeof selectors ]: ( typeof selectors )[ K ] extends (
		state: State,
		...args: infer A
	) => infer R
		? ( ...args: A ) => R
		: never;
};

export type ThunkDispatch = {
	receive: < S extends Slice >( slice: S, value: Slices[ S ], since?: number ) => void;
	discardReads: ( slice: Slice ) => void;
	writeStarted: ( kind: WriteKind ) => void;
	writeSettled: ( kind: WriteKind ) => void;
	invalidateResolution: ( selector: string, args: unknown[] ) => void;
	finishResolution: ( selector: string, args: unknown[] ) => void;
	saveServices: ( ...args: Parameters< typeof writes.saveServices > ) => Promise< unknown >;
};

export const store = createReduxStore( STORE_NAME, { reducer, actions, selectors, resolvers } );

register( store );
