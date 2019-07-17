/**
 * External dependencies
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Internal dependencies
 */
import UpgradeNudge from '../../extensions/shared/upgrade-nudge';

const upgradeNudge = renderToStaticMarkup( <UpgradeNudge /> );

export default () => ( {
	'upgrade-nudge.html': upgradeNudge,
} );
