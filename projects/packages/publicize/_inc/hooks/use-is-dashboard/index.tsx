import { createContext, useContext } from '@wordpress/element';
import type { ReactNode } from 'react';

const DashboardContext = createContext( false );

/**
 * Marks its subtree as the Social admin dashboard so shared connection/modal
 * components render their WPDS variants. The block editor mounts these
 * components without this provider, so it keeps rendering the native Gutenberg
 * UI.
 *
 * @param props          - Props.
 * @param props.children - Subtree rendered with the dashboard components.
 * @return The provider element.
 */
export function DashboardProvider( { children }: { children: ReactNode } ) {
	return <DashboardContext.Provider value={ true }>{ children }</DashboardContext.Provider>;
}

/**
 * Whether the current subtree is the Social admin dashboard. Defaults to false
 * outside a DashboardProvider (block editor).
 *
 * @return True when rendered inside a DashboardProvider.
 */
export function useIsDashboard(): boolean {
	return useContext( DashboardContext );
}
