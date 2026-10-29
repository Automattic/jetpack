// Imports nothing that bundles the connection package, so dashboards built outside My Jetpack can use it.
// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- global.d.ts is a script, so it cannot be imported.
/// <reference path="../../../global.d.ts" />
import type { ReactNode } from 'react';

// My Jetpack's `my-jetpack-header-controls` script renders the controls into this element.
export const HEADER_CONTROLS_CONTAINER_ID = 'jp-my-jetpack-header-controls';

/**
 * Whether the `my-jetpack-header-controls` flag is on.
 *
 * @return True when the header shows the controls.
 */
// Reads window directly: getMyJetpackWindowInitialState()'s types need the connection package's globals, which Boost's typecheck doesn't have.
export const isHeaderControlsEnabled = (): boolean =>
	!! window.myJetpackInitialState?.myJetpackFlags?.headerControls;

/**
 * The value for `AdminPage`'s `globalControls` outside My Jetpack: the element the controls render into.
 *
 * @param trackingContext - The host page, sent as `context` on the controls' Tracks events, e.g. 'boost'.
 * @return The container, or null while the flag is off.
 */
export const getHeaderControlsSlot = ( trackingContext: string ): ReactNode =>
	isHeaderControlsEnabled() ? (
		<div id={ HEADER_CONTROLS_CONTAINER_ID } data-tracking-context={ trackingContext } />
	) : null;
