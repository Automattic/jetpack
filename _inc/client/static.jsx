/**
 * External dependencies
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import store from 'state/redux-store';
import StaticMain from 'static-main';
import StaticWarning from 'components/jetpack-notices/static-warning';
import UpgradeNudge from '../../extensions/shared/upgrade-nudge';

const staticHtml = renderToStaticMarkup(
	<div>
		<Provider store={ store }>
			<StaticMain />
		</Provider>
	</div>
);

const noscriptNotice = renderToStaticMarkup(
	<Provider store={ store }>
		<noscript>
			<StaticWarning />
		</noscript>
	</Provider>
);

const versionNotice = renderToStaticMarkup(
	<Provider store={ store }>
		<StaticWarning />
	</Provider>
);

// Components

// Use dummy props that can be overwritten by a str_replace() on the server.
const upgradeNudge = renderToStaticMarkup(
	<UpgradeNudge plan="#PLAN#" blockName="#BLOCK_NAME#" />
);

export default () => ( {
	'static.html': staticHtml,
	'static-noscript-notice.html': noscriptNotice,
	'static-version-notice.html': versionNotice,
	'upgrade-nudge.html': upgradeNudge,
} );
