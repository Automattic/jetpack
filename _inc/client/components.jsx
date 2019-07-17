/**
 * External dependencies
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Internal dependencies
 */
import UpgradeNudge from '../../extensions/shared/upgrade-nudge';

// Use dummy props that can be overwritten by a str_replace() on the server.
const upgradeNudge = renderToStaticMarkup(
	<UpgradeNudge plan="#PLAN#" blockName="#BLOCK_NAME#" />
);

export default () => ( {
	'upgrade-nudge.html': upgradeNudge,
} );
