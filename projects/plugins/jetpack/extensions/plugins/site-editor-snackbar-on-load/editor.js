import { registerJetpackPlugin } from '@automattic/jetpack-shared-extension-utils';
import domReady from '@wordpress/dom-ready';
import { name, settings } from '.';

domReady( function () {
	registerJetpackPlugin( name, settings );
} );
