/**
 * External dependencies
 */
import { dispatch } from '@wordpress/data';
import { getQueryArg } from '@wordpress/url';
import { useEffect, useMemo } from 'react';

// The AI settings "Try it out" link lands on post-new.php with this arg so the
// editor greets the user with the AI panel already open. The arg name follows
// the existing openSidebar=global-styles convention; the value names us as the
// target, since other features share the arg.
const OPEN_SIDEBAR_QUERY_VALUE = 'jetpack-ai-assistant';

// The AI panel lives in the shared Jetpack sidebar (a JetpackPluginSidebar
// fill), so that is the sidebar to open: plugin 'jetpack-sidebar', name 'jetpack'.
const JETPACK_SIDEBAR_IDENTIFIER = 'jetpack-sidebar/jetpack';

/**
 * Whether the current URL asks for the AI Assistant sidebar to be pre-opened.
 *
 * @return {boolean} True when openSidebar=jetpack-ai-assistant is present.
 */
export function isSidebarOpenRequested(): boolean {
	return getQueryArg( window.location.href, 'openSidebar' ) === OPEN_SIDEBAR_QUERY_VALUE;
}

/**
 * Open the shared Jetpack sidebar. A no-op outside the post editor, where the
 * edit-post store is not registered.
 */
export function openJetpackSidebar(): void {
	// Addressed as a string on purpose: importing the edit-post store object
	// would register it as a side effect in editors that don't have it.
	const editPostDispatch = dispatch( 'core/edit-post' ) as
		| { openGeneralSidebar?: ( sidebar: string ) => void }
		| undefined;

	editPostDispatch?.openGeneralSidebar?.( JETPACK_SIDEBAR_IDENTIFIER );
}

/**
 * Open the Jetpack sidebar once on mount when the URL requests it. Running
 * from the sidebar plugin's own mount means the editor is necessarily up and
 * the plugin registered — with no request, or outside the editor, nothing happens.
 *
 * @return {boolean} Whether the pre-open was requested, so the caller can
 * start its AI panel expanded.
 */
export function useSidebarOpenFromUrl(): boolean {
	const requested = useMemo( isSidebarOpenRequested, [] );

	useEffect( () => {
		if ( requested ) {
			openJetpackSidebar();
		}
	}, [ requested ] );

	return requested;
}
