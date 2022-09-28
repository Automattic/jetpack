import { renderToStaticMarkup } from 'react-dom/server';
import {
	UPGRADE_NUDGE_BUTTON_TEXT,
	UPGRADE_NUDGE_DESCRIPTION,
} from '../../extended-blocks/paid-blocks/upgrade-plan-banner';
import { Nudge } from './upgrade-nudge';
import './style.scss';

// Use dummy props that can be overwritten by a str_replace() on the server.
// Note that we're using the 'dumb' component exported from `upgrade-nudge.jsx`
// rather than the 'smart' `UpgradePlanBanner` (which contains `withSelect`
// and `withDispatch` calls).
// This means putting the burden of props computation on PHP (`components.php`).
// If we wanted to use the 'smart' component instead, we'd need to provide sufficiently
// initialised Redux state when rendering ir (probably through globals set as arguments
// to the `StaticSiteGeneratorPlugin` call in `webpack.config.extensions.js`).
const frontendNudge = renderToStaticMarkup(
	<Nudge checkoutUrl="#checkoutUrl#" description="#description#" buttonText="#buttonText#" />
);

// An upgrade frontend nudge using the preset copy for the Upgrade banner
const upgradeNudge = renderToStaticMarkup(
	<Nudge
		checkoutUrl="#checkoutUrl#"
		description={ UPGRADE_NUDGE_DESCRIPTION }
		buttonText={ UPGRADE_NUDGE_BUTTON_TEXT }
	/>
);

// StaticSiteGeneratorPlugin only supports `.html` extensions, even though
// our rendered components contain some PHP.
export default () => ( {
	'frontend-nudge.html': frontendNudge,
	'upgrade-nudge.html': upgradeNudge,
} );
