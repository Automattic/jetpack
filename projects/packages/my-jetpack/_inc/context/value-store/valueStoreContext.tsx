import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

type ValueStoreType = {
	isDismissingWelcomeBanner: boolean;
	isDismissingWelcomeTour: boolean;
	isWelcomeBannerVisible: boolean;
	isWelcomeTourVisible: boolean;
	isLoadingWelcomeFlowExperiment?: boolean;
	recommendedModules: JetpackModule[] | null;
	recommendedModulesVisible: boolean;
	isFirstRun: boolean;
	productsOwnership: {
		ownedProducts: JetpackModule[];
		unownedProducts: JetpackModule[];
	};
};

type ValueStoreContextType = {
	state: Partial< ValueStoreType >;
	setState: Dispatch< SetStateAction< Partial< ValueStoreType > > >;
};

const ValueStoreContext = createContext< ValueStoreContextType >( {
	state: {},
	setState: () => {}, // noop
} );

export const useValueStore = < T extends keyof ValueStoreType >(
	key: T,
	initialValue: ValueStoreType[ T ]
): [ ValueStoreType[ T ], ( newValue: ValueStoreType[ T ] ) => void ] => {
	const { state, setState } = useContext( ValueStoreContext );
	const { [ key ]: value = initialValue } = state;

	useEffect( () => {
		if ( state[ key ] === undefined ) {
			setState( prevState => ( { ...prevState, [ key ]: initialValue } ) );
		}
	}, [ initialValue, key, setState, state ] );

	const setNewValue = useCallback(
		( newValue: ValueStoreType[ T ] ) => {
			setState( prevState => ( { ...prevState, [ key ]: newValue } ) );
		},
		[ key, setState ]
	);

	return [ value as ValueStoreType[ T ], setNewValue ];
};

const ValueStoreContextProvider = ( { children } ) => {
	const [ state, setState ] = useState( {} );
	return (
		<ValueStoreContext.Provider
			value={ {
				state,
				setState,
			} }
		>
			{ children }
		</ValueStoreContext.Provider>
	);
};

export default ValueStoreContextProvider;
