import { createContext, useContext } from 'react';

/**
 * How a `Module` presents itself: `block` is a standalone section with its own
 * heading, `row` a labelled toggle inside a group card.
 */
export type ModuleSurface = 'block' | 'row';

const ModuleSurfaceContext = createContext< ModuleSurface >( 'block' );

export const ModuleSurfaceProvider = ModuleSurfaceContext.Provider;

export const useModuleSurface = () => useContext( ModuleSurfaceContext );
