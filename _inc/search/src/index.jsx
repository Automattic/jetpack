/** @jsx h */

/**
 * External dependencies
 */
import { h, render } from 'preact';

/**
 * Internal dependencies
 */
import SearchWidget from '../components/search-widget';

const injectSearchWidget = ( initialValue, target, grabFocus ) => {
	render(
		<SearchWidget initialValue={ initialValue } grabFocus={ grabFocus } />,
		document.body,
		target
	);
};

window.injectSearchWidget = injectSearchWidget;
