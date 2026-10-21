import ConnectionControl from './connection-control';
import { isHeaderControlsEnabled } from './slot';
import type { FC, ReactNode } from 'react';

/**
 * The shared header's global controls.
 *
 * @return The controls.
 */
const HeaderControls: FC = () => <ConnectionControl />;

/**
 * The value for `AdminPage`'s `globalControls` on My Jetpack's own page: null while the `my-jetpack-header-controls` flag is off.
 *
 * @return The controls, or null.
 */
export const getHeaderControls = (): ReactNode =>
	isHeaderControlsEnabled() ? <HeaderControls /> : null;

export default HeaderControls;
