/**
 * External dependencies
 */
import { renderToStaticMarkup } from 'react-dom/server';

/**
 * Internal dependencies
 */
import { UpgradeNudge } from './upgrade-nudge';
import  { StripeNudge } from './stripe-nudge';

import './style.scss';

// Use dummy props that can be overwritten by a str_replace() on the server.
//
// Note that we're using the 'dumb' component exported from `upgrade-nudge.jsx` and
// 'stripe-nudge.jsx' here, rather than the 'smart' one (which is wrapped in `withSelect`
// and `withDispatch` calls).
// This means putting the burden of props computation on PHP (`components.php`).
// If we wanted to use the 'smart' component instead, we'd need to provide sufficiently
// initialised Redux state when rendering ir (probably through globals set as arguments
// to the `StaticSiteGeneratorPlugin` call in `webpack.config.extensions.js`).
const upgradeNudge = renderToStaticMarkup(
	<UpgradeNudge planName="#planName#" upgradeUrl="#upgradeUrl#" />
);

const stripeNudge = renderToStaticMarkup(
	<StripeNudge blockName="#blockName#" url="#url#" />
);

// StaticSiteGeneratorPlugin only supports `.html` extensions, even though
// our rendered components contain some PHP.
export default () => ( {
	'upgrade-nudge.html': upgradeNudge,
	'stripe-nudge.html': stripeNudge,
} );
