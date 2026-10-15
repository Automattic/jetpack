// eslint-disable-next-line @typescript-eslint/triple-slash-reference -- Same as header-data.ts: a package entry point.
/// <reference path="../../../global.d.ts" />
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import type { FC, ReactNode } from 'react';

/**
 * The shared header's global controls. A placeholder until the connection control (JETPACK-3052) replaces it.
 *
 * @return The controls.
 */
const HeaderControls: FC = () => (
	<Button variant="outline" size="compact" disabled>
		{ __( 'Connection', 'jetpack-my-jetpack' ) }
	</Button>
);

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
