import { createContext, useContext } from '@wordpress/element';
import type { ReactNode } from 'react';

const ModernizationContext = createContext( false );

/**
 * Marks its subtree as the modernized (chassis) Social UI so shared
 * connection/modal components render their WPDS variants. The legacy admin
 * page and the block editor mount these components without this provider, so
 * they keep rendering the original UI.
 *
 * @param props          - Props.
 * @param props.children - Subtree rendered with the modernized components.
 * @return The provider element.
 */
export function ModernizationProvider( { children }: { children: ReactNode } ) {
	return <ModernizationContext.Provider value={ true }>{ children }</ModernizationContext.Provider>;
}

/**
 * Whether the current subtree is the modernized (chassis) Social UI. Defaults
 * to false outside a ModernizationProvider (legacy admin page / block editor).
 *
 * @return True when rendered inside a ModernizationProvider.
 */
export function useIsModernized(): boolean {
	return useContext( ModernizationContext );
}
