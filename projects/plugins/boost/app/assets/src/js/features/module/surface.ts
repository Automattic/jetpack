import { createContext, useContext } from 'react';

/**
 * How a `Module` presents itself: `block` is a standalone section with its own
 * heading, `row` a labelled toggle inside a group card.
 */
export type ModuleSurface = 'block' | 'row';

const ModuleSurfaceContext = createContext< ModuleSurface >( 'block' );

export const ModuleSurfaceProvider = ModuleSurfaceContext.Provider;

export const useModuleSurface = () => useContext( ModuleSurfaceContext );

const portalTooltip = { inline: false, shift: true };

/**
 * `IconTooltip` props for this surface: group cards clip their overflow, so
 * tooltips inside a row render in a portal, shifted to stay on screen.
 */
export const useTooltipLayer = () => ( useModuleSurface() === 'row' ? portalTooltip : {} );
