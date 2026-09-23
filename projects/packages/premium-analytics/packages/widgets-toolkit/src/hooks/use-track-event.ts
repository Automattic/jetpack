/**
 * External dependencies
 */
import jetpackAnalytics from '@automattic/jetpack-analytics';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useCallback, useMemo, useRef } from 'react';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

// The tracker is a page-wide singleton: identify once per page load, not per event
// and not on every consumer's mount.
let hasIdentified = false;

/**
 * Reset the identify latch. Test-only.
 *
 * Module state outlives a render/unmount cycle by design, which is the point of the latch,
 * but it would otherwise leave every test after the first observing nothing.
 */
export function resetTracksIdentityForTesting() {
	hasIdentified = false;
}

/**
 * Identify the reader and pin `blog_id` onto every event from this page load.
 */
function identifyOnce() {
	if ( hasIdentified ) {
		return;
	}
	hasIdentified = true;

	const scriptData = getScriptData();
	const wpcomUser = scriptData?.user?.current_user?.wpcom;

	// Not `initialize()`: it routes through `setSuperProps`, which replaces rather than
	// merges, so it would wipe whatever another consumer on this page already pinned.
	if ( wpcomUser?.ID && wpcomUser?.login ) {
		jetpackAnalytics.setUser( wpcomUser.ID, wpcomUser.login );
		jetpackAnalytics.identifyUser();
	}

	const blogId = scriptData?.site?.wpcom?.blog_id;

	if ( blogId ) {
		jetpackAnalytics.assignSuperProps( { blog_id: blogId } );
	}
}

/**
 * Returns a stable callback for emitting `jetpack_premium_analytics_*` Tracks events.
 *
 * @return Callback recording a Tracks event by name, with optional properties.
 */
export function useTrackEvent() {
	return useCallback( ( eventName: string, properties?: Record< string, unknown > ) => {
		identifyOnce();

		jetpackAnalytics.tracks.recordEvent( eventName, properties );
	}, [] );
}

/**
 * The page a customize event came from.
 */
export type TrackingSurface = 'dashboard' | 'post_detail' | 'author_detail' | 'video_detail';

/**
 * The widget types in one layout whose instances the other lacks, comma-joined.
 *
 * @param layout - The layout to list from.
 * @param other  - The layout to compare against.
 * @return The widget types, in layout order.
 */
function typesMissingFrom( layout: DashboardWidget[], other: DashboardWidget[] ) {
	const uuids = new Set( other.map( widget => widget.uuid ) );

	return layout
		.filter( widget => ! uuids.has( widget.uuid ) )
		.map( widget => widget.type )
		.join( ',' );
}

/**
 * Tracks the customize lifecycle: `customize_start`, `customize_save`, `customize_exit` and
 * `customize_reset`.
 *
 * @param surface - The page being customized.
 * @param section - The dashboard section, on the dashboard only.
 * @return Callbacks to call from the page's own customize handlers.
 */
export function useTrackCustomize( surface?: TrackingSurface, section?: string ) {
	const trackEvent = useTrackEvent();
	const pendingSave = useRef< Record< string, unknown > | null >( null );

	return useMemo( () => {
		const properties = { surface, ...( section ? { section } : {} ) };

		return {
			start: () => trackEvent( 'jetpack_premium_analytics_customize_start', properties ),

			/*
			 * Held until the end of the tick rather than recorded here: Done commits the layout
			 * and leaves edit mode in one call, while an inline widget edit saving itself — which
			 * upstream flushes on entering edit mode — arrives with no exit behind it.
			 */
			layoutChange: ( previous: DashboardWidget[], next: DashboardWidget[] ) => {
				pendingSave.current = {
					widget_count: next.length,
					widgets_added: typesMissingFrom( next, previous ),
					widgets_removed: typesMissingFrom( previous, next ),
				};
				queueMicrotask( () => {
					pendingSave.current = null;
				} );
			},

			exit: () => {
				const save = pendingSave.current;
				pendingSave.current = null;

				if ( save ) {
					trackEvent( 'jetpack_premium_analytics_customize_save', { ...properties, ...save } );
				}
				trackEvent( 'jetpack_premium_analytics_customize_exit', { ...properties, saved: !! save } );
			},

			reset: () => trackEvent( 'jetpack_premium_analytics_customize_reset', properties ),
		};
	}, [ section, surface, trackEvent ] );
}
