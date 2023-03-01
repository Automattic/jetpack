/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';

domReady( function () {
	// eslint-disable-next-line no-console
	console.log( __( 'VideoPress init', 'jetpack-videopress-pkg' ) );
} );
