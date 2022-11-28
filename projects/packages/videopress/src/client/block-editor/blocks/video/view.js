/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

domReady( function () {
	// eslint-disable-next-line no-console
	console.log( __( 'VideoPress init', 'jetpack-videopress-pkg' ) );
} );
