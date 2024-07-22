import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the context value
interface ScanSectionContextValue {
	filter: string | null;
	setFilter: ( value: string | null ) => void;
}

// Create the context with a default value
const ScanSectionContext = createContext< ScanSectionContextValue | undefined >( undefined );

// Create a provider component
const ScanSectionContextProvider: React.FC< { children: ReactNode } > = ( { children } ) => {
	const [ filter, setFilter ] = useState< string | null >( null );

	return (
		<ScanSectionContext.Provider value={ { filter, setFilter } }>
			{ children }
		</ScanSectionContext.Provider>
	);
};

// Custom hook to use the filter context
const useScanSectionContext = (): ScanSectionContextValue => {
	const context = useContext( ScanSectionContext );
	if ( context === undefined ) {
		throw new Error( 'useScanSectionContext must be used within a FilterProvider' );
	}
	return context;
};

export { ScanSectionContextProvider, useScanSectionContext };
