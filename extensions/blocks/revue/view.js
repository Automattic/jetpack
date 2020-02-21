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
		form.innerHTML = '';

		const notice = document.createElement( 'div' );
		notice.innerHTML = `<p><strong>${ __( 'Subscription received!', 'jetpack' ) }</strong></p>
		<p>${ __( 'Please check your email to confirm your newsletter subscription.', 'jetpack' ) }</p>`;

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
