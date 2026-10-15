// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- Same as header-data.ts: a package entry point.
/// <reference path="../../../global.d.ts" />
import ConnectionControl from './connection-control';
import type { FC, ReactNode } from 'react';

/**
 * The shared header's global controls.
 *
 * @return The controls.
 */
const HeaderControls: FC = () => <ConnectionControl />;

/**
 * The value for `AdminPage`'s `globalControls`.
 *
 * Null while the `my-jetpack-header-controls` flag is off, since any element makes `Page` draw an actions row.
 *
 * @return The controls, or null.
 */
export const getHeaderControls = (): ReactNode =>
	window.myJetpackInitialState?.myJetpackFlags?.headerControls ? <HeaderControls /> : null;

export default HeaderControls;
