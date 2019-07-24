/**
 * External dependencies
 */
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Internal dependencies
 */
import { UpgradeNudge } from '../upgrade-nudge';

import './style.scss';

// Use dummy props that can be overwritten by a str_replace() on the server.
const upgradeNudge = renderToStaticMarkup(
	<UpgradeNudge
		autosaveAndRedirectToUpgrade="#autosaveAndRedirectToUpgrade#"
		planName="#planName#"
		upgradeUrl="#upgradeUrl#"
	/>
);

// StaticSiteGeneratorPlugin only supports `.html` extensions, even though
// our rendered components contain some PHP.
export default () => ( {
	'upgrade-nudge.html': upgradeNudge,
} );
