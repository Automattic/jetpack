import apiFetch from '@wordpress/api-fetch';

/**
 * Capitalizes the first letter of a string.
 *
 * @param {string} str - The string to capitalize.
 *
 * @return {string} The capitalized string.
 */
function capitalize< Str extends string >( str: Str ): Capitalize< Str > {
	return ( str.charAt( 0 ).toUpperCase() + str.slice( 1 ) ) as Capitalize< Str >;
}

/**
 * The state of a data sync.
 */
export type WpDataSyncState< Key extends string, Shape extends object > = {
	[ K in Key ]: {
		/**
		 * The actual data being synced.
		 */
		data?: Shape;
		/**
		 * The status of the data sync.
		 */
		status?: 'initial' | 'idle' | 'fetching' | 'updating' | 'error';
		/**
		 * The last error that occurred.
		 */
		lastError?: unknown;
	};
};

/**
 * Possible action types
 */
type ActionType< Key extends string > =
	| `setErrorFor${ Capitalize< Key > }`
	| `setStatusFor${ Capitalize< Key > }`
	| `set${ Capitalize< Key > }`
	| `update${ Capitalize< Key > }`
	| `fetch${ Capitalize< Key > }`;

/**
 * Action objects that can be dispatched.
 */
type ActionObjects< Key extends string, Shape extends object > =
	| {
			type: `setErrorFor${ Capitalize< Key > }`;
			payload: {
				error: unknown;
			};
	  }
	| {
			type: `setStatusFor${ Capitalize< Key > }`;
			payload: {
				status: WpDataSyncState< Key, Shape >[ Key ][ 'status' ];
			};
	  }
	| {
			type: `set${ Capitalize< Key > }`;
			payload: Partial< Shape >;
	  };

/**
 * The signature of the actions that can be dispatched.
 */
type ActionSignature< Key extends string, Shape extends object > = {
	setStatusFor: (
		status: WpDataSyncState< Key, Shape >[ Key ][ 'status' ]
	) => Extract< ActionObjects< Key, Shape >, { type: `setStatusFor${ Capitalize< Key > }` } >;
	setErrorFor: (
		error: unknown
	) => Extract< ActionObjects< Key, Shape >, { type: `setErrorFor${ Capitalize< Key > }` } >;
	set: (
		payload: Partial< Shape >
	) => Extract< ActionObjects< Key, Shape >, { type: `set${ Capitalize< Key > }` } >;
	// Thunks
	fetch: () => () => Promise< void >;
	update: ( payload: Partial< Shape > ) => () => Promise< void >;
};

/**
 * The actions that get generated automatically.
 */
export type GeneratedActions< Key extends string, Shape extends object > = {
	[ K in ActionType< Key > ]: K extends `setStatusFor${ Capitalize< Key > }`
		? ActionSignature< Key, Shape >[ 'setStatusFor' ]
		: K extends `setErrorFor${ Capitalize< Key > }`
		? ActionSignature< Key, Shape >[ 'setErrorFor' ]
		: K extends `set${ Capitalize< Key > }`
		? ActionSignature< Key, Shape >[ 'set' ]
		: K extends `update${ Capitalize< Key > }`
		? ActionSignature< Key, Shape >[ 'update' ]
		: K extends `fetch${ Capitalize< Key > }`
		? ActionSignature< Key, Shape >[ 'fetch' ]
		: never;
};

/**
 * Possible selectors that can be generated.
 */
export type PossibleSelectors< Key extends string > =
	| `get${ Capitalize< Key > }LastError`
	| `get${ Capitalize< Key > }Status`
	| `get${ Capitalize< Key > }`;

/**
 * The selectors that get generated automatically.
 */
export type GeneratedSelectors< Key extends string, Shape extends object > = {
	[ K in PossibleSelectors< Key > ]: (
		state: WpDataSyncState< Key, Shape >
	) => K extends `get${ Capitalize< Key > }Status`
		? WpDataSyncState< Key, Shape >[ Key ][ 'status' ]
		: K extends `get${ Capitalize< Key > }LastError`
		? WpDataSyncState< Key, Shape >[ Key ][ 'lastError' ]
		: K extends `get${ Capitalize< Key > }`
		? WpDataSyncState< Key, Shape >[ Key ][ 'data' ]
		: never;
};

/**
 * The return type of the createWpDataSync function.
 */
export interface CreateWpDataSyncReturn< Key extends string, Shape extends object > {
	actions: GeneratedActions< Key, Shape >;
	reducers: {
		[ K in Key ]: (
			state: WpDataSyncState< Key, Shape >[ Key ],
			action: ActionObjects< Key, Shape >
		) => WpDataSyncState< Key, Shape >[ Key ];
	};
	selectors: GeneratedSelectors< Key, Shape >;
	resolvers: {
		[ K in `get${ Capitalize< Key > }` ]: () => () => Promise< void >;
	};
}

/**
 * The options for the data sync.
 */
export type WpDataSyncOptions< Shape extends object > = {
	/**
	 * The endpoint to sync the data with.
	 */
	endpoint: string;
	/**
	 * The initial state of the data
	 */
	initialState?: Shape;
	/**
	 * A function to extract the data from the fetch response.
	 *
	 * If not provided, the response will be used as is.
	 */
	extractFetchResponse?: ( response: unknown ) => Partial< Shape >;
	/**
	 * A function to prepare the request for updating the data.
	 *
	 * If not provided, the payload will be used as is.
	 */
	prepareUpdateRequest?: ( data: Partial< Shape > ) => unknown;
};

/**
 * Creates a set of actions, reducers, selectors, and resolvers for a data sync.
 *
 * @param {string}            key     - The key for the data sync.
 * @param {WpDataSyncOptions} options - The options for the data sync.
 *
 * @return {CreateWpDataSyncReturn} The actions, reducers, selectors, and resolvers for the data sync.
 */
export function createWpDataSync< Shape extends object, Key extends string >(
	key: Key,
	{ endpoint, extractFetchResponse, initialState, prepareUpdateRequest }: WpDataSyncOptions< Shape >
) {
	const capitalizedKey = capitalize( key );

	return {
		resolvers: {
			[ `get${ capitalizedKey }` as const ]: () => {
				return async function ( { dispatch } ) {
					await dispatch[ `fetch${ capitalizedKey }` ]();
				};
			},
		},
		selectors: {
			[ `get${ capitalizedKey }` as const ]: ( state: WpDataSyncState< Key, Shape > ) => {
				return state[ key ].data;
			},
			[ `get${ capitalizedKey }Status` as const ]: ( state: WpDataSyncState< Key, Shape > ) => {
				return state[ key ].status;
			},
			[ `get${ capitalizedKey }LastError` as const ]: ( state: WpDataSyncState< Key, Shape > ) => {
				return state[ key ].lastError;
			},
		},
		actions: {
			[ `set${ capitalizedKey }` as const ]: ( payload: Partial< Shape > ) => {
				return {
					type: `set${ capitalizedKey }` as const,
					payload,
				};
			},
			[ `setErrorFor${ capitalizedKey }` as const ]: ( error: unknown ) => {
				return {
					type: `setErrorFor${ capitalizedKey }` as const,
					payload: {
						error,
					},
				};
			},
			[ `setStatusFor${ capitalizedKey }` as const ]: (
				status: WpDataSyncState< Key, Shape >[ Key ][ 'status' ]
			) => {
				return {
					type: `setStatusFor${ capitalizedKey }` as const,
					payload: {
						status,
					},
				};
			},
			[ `fetch${ capitalizedKey }` as const ]: () => {
				return async function ( { dispatch, select } ) {
					const status = select[ `get${ capitalizedKey }Status` ]();

					if ( status === 'fetching' || status === 'updating' ) {
						return;
					}
					const setStatus = dispatch[ `setStatusFor${ capitalizedKey }` ];

					setStatus( 'fetching' );

					try {
						const response = await apiFetch< Response >( { path: endpoint } );

						const result = extractFetchResponse?.( response ) ?? response;

						dispatch[ `set${ capitalizedKey }` ]( result );

						setStatus( 'idle' );
					} catch ( error ) {
						setStatus( 'error' );

						dispatch[ `setErrorFor${ capitalizedKey }` ]( error );
					}
				};
			},
			[ `update${ capitalizedKey }` as const ]: ( payload: Partial< Shape > ) => {
				return async function ( { dispatch, select } ) {
					const prevValue = select[ `get${ capitalizedKey }` ]();

					const setStatus = dispatch[ `setStatusFor${ capitalizedKey }` ];

					try {
						// Optimistically update the data.
						dispatch[ `set${ capitalizedKey }` ]( payload );

						setStatus( 'updating' );

						const data = prepareUpdateRequest?.( payload ) ?? payload;

						await apiFetch( { method: 'POST', path: endpoint, data } );

						setStatus( 'idle' );
					} catch ( error ) {
						// Revert the value to its previous state.
						dispatch[ `set${ capitalizedKey }` ]( prevValue );

						setStatus( 'error' );

						dispatch[ `setErrorFor${ capitalizedKey }` ]( error );
					}
				};
			},
		},
		reducers: {
			[ key ]: (
				state: WpDataSyncState< Key, Shape >[ Key ] = { data: initialState, status: 'initial' },
				action: ActionObjects< Key, Shape >
			): WpDataSyncState< Key, Shape >[ Key ] => {
				switch ( action.type ) {
					case `setStatusFor${ capitalizedKey }` as const: {
						return {
							...state,
							status: 'status' in action.payload ? action.payload.status : state.status,
						};
					}
					case `setErrorFor${ capitalizedKey }` as const: {
						return {
							...state,
							lastError: 'error' in action.payload ? action.payload.error : state.lastError,
						};
					}

					case `set${ capitalizedKey }` as const: {
						return {
							...state,
							data: {
								...state.data,
								...action.payload,
							},
						};
					}

					default: {
						return state;
					}
				}
			},
		},
	} as CreateWpDataSyncReturn< Key, Shape >;
}
