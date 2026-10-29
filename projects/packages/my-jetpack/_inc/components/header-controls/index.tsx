import ConnectionControl from './connection-control';
import { isHeaderControlsEnabled } from './slot';
import type { FC, ReactNode } from 'react';

interface HeaderControlsProps {
	/**
	 * The host page, sent as `context` on the controls' Tracks events. Required so every host names
	 * itself; undefined only when an older host's slot carries none, and is then sent as null.
	 */
	trackingContext: string | undefined;
}

/**
 * The shared header's global controls.
 *
 * @param props                 - Component props.
 * @param props.trackingContext - The host page, for Tracks.
 * @return The controls.
 */
const HeaderControls: FC< HeaderControlsProps > = ( { trackingContext } ) => (
	<ConnectionControl trackingContext={ trackingContext } />
);

/**
 * The value for `AdminPage`'s `globalControls` on My Jetpack's own page: null while the `my-jetpack-header-controls` flag is off.
 *
 * @return The controls, or null.
 */
export const getHeaderControls = (): ReactNode =>
	isHeaderControlsEnabled() ? <HeaderControls trackingContext="my-jetpack" /> : null;

export default HeaderControls;
