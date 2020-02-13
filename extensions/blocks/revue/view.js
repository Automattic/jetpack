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

const revueSubscribe = event => {
	event.preventDefault();
	const form = event.target;
	const { ajaxUrl, nonce, revueUsername } = window.jetpackRevueBlock;

	const member = {
		email: form.querySelector( '.wp-block-jetpack-revue__email' ).value,
		first_name: form.querySelector( '.wp-block-jetpack-revue__first-name' ).value,
		last_name: form.querySelector( '.wp-block-jetpack-revue__last-name' ).value,
	};

	jQuery.post(
		ajaxUrl,
		{
			_ajax_nonce: nonce,
			action: 'jetpack_revue_subscribe',
			member,
			revueUsername,
		},
		( { status, message } ) => {
			const notice = document.createElement( 'div' );
			if ( 'success' === status ) {
				notice.innerHTML = __( 'Congratulations, you are subscribed!', 'jetpack' );
				form.innerHTML = '';
			} else {
				notice.innerHTML = message;
			}
			form.prepend( notice );
		}
	);
};

if ( typeof window !== 'undefined' && window.jQuery ) {
	domReady( function() {
		const revueForms = document.querySelectorAll( '.wp-block-jetpack-revue form' );

		each( revueForms, form => {
			form.addEventListener( 'submit', revueSubscribe );
		} );
	} );
}
