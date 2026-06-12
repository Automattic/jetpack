/**
 * Tiny client-side router for the Beta dashboard.
 *
 * The overview and a plugin's manage screen are distinguished by the
 * `?plugin=<slug>` URL param. Navigating between them with the History API
 * (instead of following the server-built `manage_url` links) avoids a full page
 * reload, while keeping the same URLs — so they stay bookmarkable and the server
 * still renders the right screen on a cold load.
 *
 * @package
 */

import { createContext, useContext } from '@wordpress/element';
import type { MouseEvent } from 'react';

export type NavigateFn = ( slug: string | null ) => void;

/**
 * Context carrying the client-side navigate function down to the screens that
 * trigger navigation (the plugin-list rows and the manage breadcrumb).
 */
export const BetaNavContext = createContext< NavigateFn >( () => {} );

/**
 * Read the client-side navigate function.
 *
 * @return The navigate function provided by the App.
 */
export const useBetaNavigate = (): NavigateFn => useContext( BetaNavContext );

/**
 * Whether a click should be handled client-side rather than left to the browser.
 *
 * A plain left click (no modifier keys) navigates within the app; modified
 * clicks (⌘/Ctrl/Shift/middle button) keep their default behaviour so links can
 * still be opened in a new tab.
 *
 * @param event - The mouse event from the clicked link.
 * @return True for a plain left click.
 */
export const isPlainClick = ( event: MouseEvent ): boolean =>
	event.button === 0 && ! event.metaKey && ! event.ctrlKey && ! event.shiftKey && ! event.altKey;
