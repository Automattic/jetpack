/**
 * External dependencies
 */
import { each } from 'lodash';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './view.scss';

const revueSubscribe = event =>
	setTimeout( () => {
		const form = event.target;
		const notice = document.createElement( 'div' );
		notice.innerHTML = __( 'You can complete your registration in the new page.', 'jetpack' );
		form.innerHTML = '';
		form.prepend( notice );
	}, 1000 );

if ( typeof window !== 'undefined' && window.jQuery ) {
	domReady( function() {
		const revueForms = document.querySelectorAll( '.wp-block-jetpack-revue form' );

		each( revueForms, form => {
			form.addEventListener( 'submit', revueSubscribe );
		} );
	} );
}
