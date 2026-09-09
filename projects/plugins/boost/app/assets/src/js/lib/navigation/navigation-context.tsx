import { createContext, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router';
import type { ReactNode } from 'react';

type NavigateOptions = {
	replace?: boolean;
};

type BoostNavigation = {
	returnToSettings: ( options?: NavigateOptions ) => void;
};

const NavigationContext = createContext< BoostNavigation | null >( null );

export function useBoostNavigation(): BoostNavigation {
	const navigation = useContext( NavigationContext );

	if ( ! navigation ) {
		throw new Error( 'useBoostNavigation must be used inside a Boost navigation provider.' );
	}

	return navigation;
}

/**
 * Navigation for the legacy hash router. Must render inside the router.
 *
 * @param props          - Component props.
 * @param props.children - Tree to provide navigation to.
 */
export function LegacyNavigationProvider( { children }: { children: ReactNode } ) {
	const navigate = useNavigate();
	const navigation = useMemo< BoostNavigation >(
		() => ( { returnToSettings: options => navigate( '/', options ) } ),
		[ navigate ]
	);

	return <NavigationContext.Provider value={ navigation }>{ children }</NavigationContext.Provider>;
}
