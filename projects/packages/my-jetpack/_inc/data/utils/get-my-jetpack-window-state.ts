type InitialState = Window[ 'myJetpackInitialState' ];
type RestState = Window[ 'myJetpackRest' ];
type ConnectionState = Window[ 'JP_CONNECTION_INITIAL_STATE' ];

// Handles typing based on whether or not a key is provided. S = type of state, A = type of key
type StateReturnType< S, A > = A extends undefined ? S : S[ A extends keyof S ? A : never ];

export const getMyJetpackWindowInitialState = <
	A extends keyof InitialState | undefined = undefined,
>(
	key?: A
): StateReturnType< InitialState, A > => {
	if ( ! key ) {
		return window?.myJetpackInitialState as StateReturnType< InitialState, A >;
	}

	return ( window?.myJetpackInitialState?.[ key ] ?? {} ) as StateReturnType< InitialState, A >;
};

/**
 * Slugs a host hid from the page through `jetpack_my_jetpack_feature_visibility`.
 *
 * @return Product card and module slugs.
 */
export const getHiddenFeatures = (): Array< string > => {
	const hidden = window?.myJetpackInitialState?.hiddenFeatures;

	return Array.isArray( hidden ) ? hidden : [];
};

export const getMyJetpackWindowRestState = () => {
	return ( window?.myJetpackRest ?? {} ) as RestState;
};

export const getMyJetpackWindowConnectionState = <
	A extends keyof ConnectionState | undefined = undefined,
>(
	key?: A
): StateReturnType< ConnectionState, A > => {
	if ( ! key ) {
		return window?.JP_CONNECTION_INITIAL_STATE as StateReturnType< ConnectionState, A >;
	}

	return ( window?.JP_CONNECTION_INITIAL_STATE?.[ key ] ?? {} ) as StateReturnType<
		ConnectionState,
		A
	>;
};
