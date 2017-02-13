/**
 * External dependencies
 */
import Server from 'react-dom/server';
import React from 'react';
import { Provider } from 'react-redux';

/**
 * Internal dependencies
 */
import store from 'state/redux-store';
import StaticMain from 'static-main';
import StaticWarning from 'components/jetpack-notices/static-warning';

window.staticHtml = Server.renderToStaticMarkup(
		<div>
			<Provider store={ store }>
				<StaticMain />
			</Provider>
		</div>
	);

window.noscriptNotice = Server.renderToStaticMarkup(
		<Provider store={ store }>
			<noscript>
				<StaticWarning />
			</noscript>
		</Provider>
	);

window.versionNotice = Server.renderToStaticMarkup(
		<Provider store={ store }>
			<StaticWarning />
		</Provider>
	);

window.ieNotice = Server.renderToStaticMarkup(
		<Provider store={ store }>
			<div id="ie-legacy-notice" style={{ display: 'none' }}>
				<StaticWarning  />
			</div>
		</Provider>
	);

window.ieNotice = window.ieNotice +
	"<script type=\"text/javascript\">\n" +
	"/*@cc_on\n" +
	"if ( @_jscript_version <= 10) {\n" +
	"jQuery( '#ie-legacy-notice' ).show();\n" +
	"}\n" +
	"@*/\n" +
	"</script>";
