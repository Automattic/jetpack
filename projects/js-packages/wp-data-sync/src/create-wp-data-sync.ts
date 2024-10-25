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
export type WpDataSyncState< Shape extends object > = {
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

/**
 * Possible action types
 */
type ActionType< Name extends string > =
	| `setErrorFor${ Capitalize< Name > }`
	| `setStatusFor${ Capitalize< Name > }`
	| `set${ Capitalize< Name > }`
	| `update${ Capitalize< Name > }`
	| `fetch${ Capitalize< Name > }`;

/**
 * Action objects that can be dispatched.
 */
type ActionObjects< Name extends string, Shape extends object > =
	| {
			type: `setErrorFor${ Capitalize< Name > }`;
			payload: {
				error: unknown;
			};
	  }
	| {
			type: `setStatusFor${ Capitalize< Name > }`;
			payload: {
				status: WpDataSyncState< Shape >[ 'status' ];
			};
	  }
	| {
			type: `set${ Capitalize< Name > }`;
			payload: Partial< Shape >;
	  };

/**
 * The signature of the actions that can be dispatched.
 */
type ActionSignature< Name extends string, Shape extends object > = {
	setStatusFor: (
		status: WpDataSyncState< Shape >[ 'status' ]
	) => Extract< ActionObjects< Name, Shape >, { type: `setStatusFor${ Capitalize< Name > }` } >;
	setErrorFor: (
		error: unknown
	) => Extract< ActionObjects< Name, Shape >, { type: `setErrorFor${ Capitalize< Name > }` } >;
	set: (
		payload: Partial< Shape >
	) => Extract< ActionObjects< Name, Shape >, { type: `set${ Capitalize< Name > }` } >;
	// Thunks
	fetch: () => () => Promise< void >;
	update: ( payload: Partial< Shape > ) => () => Promise< void >;
};

/**
 * The actions that get generated automatically.
 */
export type GeneratedActions< Name extends string, Shape extends object > = {
	[ K in ActionType< Name > ]: K extends `setStatusFor${ Capitalize< Name > }`
		? ActionSignature< Name, Shape >[ 'setStatusFor' ]
		: K extends `setErrorFor${ Capitalize< Name > }`
		? ActionSignature< Name, Shape >[ 'setErrorFor' ]
		: K extends `set${ Capitalize< Name > }`
		? ActionSignature< Name, Shape >[ 'set' ]
		: K extends `update${ Capitalize< Name > }`
		? ActionSignature< Name, Shape >[ 'update' ]
		: K extends `fetch${ Capitalize< Name > }`
		? ActionSignature< Name, Shape >[ 'fetch' ]
		: never;
};

/**
 * Possible selectors that can be generated.
 */
export type PossibleSelectors< Name extends string > =
	| `get${ Capitalize< Name > }LastError`
	| `get${ Capitalize< Name > }Status`
	| `get${ Capitalize< Name > }`;

/**
 * The selectors that get generated automatically.
 */
export type GeneratedSelectors< Name extends string, Shape extends object > = {
	[ K in PossibleSelectors< Name > ]: (
		state: object
	) => K extends `get${ Capitalize< Name > }Status`
		? WpDataSyncState< Shape >[ 'status' ]
		: K extends `get${ Capitalize< Name > }LastError`
		? WpDataSyncState< Shape >[ 'lastError' ]
		: K extends `get${ Capitalize< Name > }`
		? WpDataSyncState< Shape >[ 'data' ]
		: never;
};

/**
 * The return type of the createWpDataSync function.
 */
export interface CreateWpDataSyncReturn< Name extends string, Shape extends object > {
	actions: GeneratedActions< Name, Shape >;
	reducer: (
		state: WpDataSyncState< Shape >,
		action: ActionObjects< Name, Shape >
	) => WpDataSyncState< Shape >;
	selectors: GeneratedSelectors< Name, Shape >;
	resolvers: {
		[ K in `get${ Capitalize< Name > }` ]: () => () => Promise< void >;
	};
}

const defaultGetSliceFromState = ( name: string ) => ( state: object ) => state[ name ];

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

	/**
	 * A function to get the slice from the state.
	 *
	 * This is useful when the data is nested in the state
	 * or if you use a reducer key different from the name.
	 */
	getSliceFromState?: ( state: object ) => WpDataSyncState< Shape >;
};

/**
 * Creates a set of actions, reducers, selectors, and resolvers for a data sync.
 *
 * @param {string}            name    - The name to use in actions, selectors and resolvers.
 * @param {WpDataSyncOptions} options - The options for the data sync.
 *
 * @return {CreateWpDataSyncReturn} The actions, reducers, selectors, and resolvers for the data sync.
 */
export function createWpDataSync< Shape extends object, Name extends string >(
	name: Name,
	{
		endpoint,
		extractFetchResponse,
		getSliceFromState = defaultGetSliceFromState( name ),
		initialState,
		prepareUpdateRequest,
	}: WpDataSyncOptions< Shape >
) {
	const capitalizedName = capitalize( name );

	return {
		resolvers: {
			[ `get${ capitalizedName }` as const ]: () => {
				return async function ( { dispatch } ) {
					await dispatch[ `fetch${ capitalizedName }` ]();
				};
			},
		},
		selectors: {
			[ `get${ capitalizedName }` as const ]: ( state: object ) => {
				return getSliceFromState( state )?.data;
			},
			[ `get${ capitalizedName }Status` as const ]: ( state: object ) => {
				return getSliceFromState( state )?.status;
			},
			[ `get${ capitalizedName }LastError` as const ]: ( state: object ) => {
				return getSliceFromState( state )?.lastError;
			},
		},
		actions: {
			[ `set${ capitalizedName }` as const ]: ( payload: Partial< Shape > ) => {
				return {
					type: `set${ capitalizedName }` as const,
					payload,
				};
			},
			[ `setErrorFor${ capitalizedName }` as const ]: ( error: unknown ) => {
				return {
					type: `setErrorFor${ capitalizedName }` as const,
					payload: {
						error,
					},
				};
			},
			[ `setStatusFor${ capitalizedName }` as const ]: (
				status: WpDataSyncState< Shape >[ 'status' ]
			) => {
				return {
					type: `setStatusFor${ capitalizedName }` as const,
					payload: {
						status,
					},
				};
			},
			[ `fetch${ capitalizedName }` as const ]: () => {
				return async function ( { dispatch, select } ) {
					const status = select[ `get${ capitalizedName }Status` ]();

					if ( status === 'fetching' || status === 'updating' ) {
						return;
					}
					const setStatus = dispatch[ `setStatusFor${ capitalizedName }` ];

					setStatus( 'fetching' );

					try {
						// @ts-expect-error apiFetch is callable
						const response = await apiFetch< Response >( { path: endpoint } );

						const result = extractFetchResponse?.( response ) ?? response;

						dispatch[ `set${ capitalizedName }` ]( result );

						setStatus( 'idle' );
					} catch ( error ) {
						setStatus( 'error' );

						dispatch[ `setErrorFor${ capitalizedName }` ]( error );
					}
				};
			},
			[ `update${ capitalizedName }` as const ]: ( payload: Partial< Shape > ) => {
				return async function ( { dispatch, select } ) {
					const prevValue = select[ `get${ capitalizedName }` ]();

					const setStatus = dispatch[ `setStatusFor${ capitalizedName }` ];

					try {
						// Optimistically update the data.
						dispatch[ `set${ capitalizedName }` ]( payload );

						setStatus( 'updating' );

						const data = prepareUpdateRequest?.( payload ) ?? payload;

						// @ts-expect-error apiFetch is callable
						await apiFetch( { method: 'POST', path: endpoint, data } );

						setStatus( 'idle' );
					} catch ( error ) {
						// Revert the value to its previous state.
						dispatch[ `set${ capitalizedName }` ]( prevValue );

						setStatus( 'error' );

						dispatch[ `setErrorFor${ capitalizedName }` ]( error );
					}
				};
			},
		},
		reducer: (
			state: WpDataSyncState< Shape > = { data: initialState, status: 'initial' },
			action: ActionObjects< Name, Shape >
		): WpDataSyncState< Shape > => {
			switch ( action.type ) {
				case `setStatusFor${ capitalizedName }` as const: {
					return {
						...state,
						status: 'status' in action.payload ? action.payload.status : state.status,
					};
				}
				case `setErrorFor${ capitalizedName }` as const: {
					return {
						...state,
						lastError: 'error' in action.payload ? action.payload.error : state.lastError,
					};
				}

				case `set${ capitalizedName }` as const: {
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
	} as CreateWpDataSyncReturn< Name, Shape >;
}
