import { createContext, useContext } from '@wordpress/element';
import type { Config } from '../types';
import type { FunctionComponent, ReactNode } from 'react';

interface TourKitContext {
	config: Config;
}

const TourKitContext = createContext< TourKitContext >( {} as TourKitContext );

export const TourKitContextProvider: FunctionComponent<
	TourKitContext & { children?: ReactNode }
> = ( { config, children } ) => {
	return <TourKitContext.Provider value={ { config } }>{ children }</TourKitContext.Provider>;
};

export const useTourKitContext = (): TourKitContext => useContext( TourKitContext );
