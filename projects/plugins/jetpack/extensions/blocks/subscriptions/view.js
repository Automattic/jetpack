/* global tb_show */

import './view.scss';
import '../../shared/memberships.scss';

import domReady from '@wordpress/dom-ready';
import { handleIframeResult } from '../../../extensions/shared/memberships';

domReady( function () {
	const form = document.querySelector( '.wp-block-jetpack-subscriptions__container form' );
	if ( ! form ) {
		return;
	}
	if ( ! form.payments_attached ) {
		form.payments_attached = true;
		form.addEventListener( 'submit', function ( event ) {
			event.preventDefault();

			const email = form.querySelector( 'input[type=email]' ).value;

			if ( form.resubmitted || ! email ) {
				return;
			}

			const post_id = form.querySelector( 'input[name=post_id]' )?.value ?? '';
			const tier_id = form.querySelector( 'input[name=tier_id]' )?.value ?? '';

			const params = new URLSearchParams( {
				email: encodeURIComponent( email ),
				post_id,
				tier_id,
				blog: form.dataset.blog,
				plan: 'newsletter',
				source: 'jetpack_subscribe',
				post_access_level: form.dataset.post_access_level,
				display: 'alternate',
				TB_iframe: true, // Required by ThickBox modal library. See https://codex.wordpress.org/Javascript_Reference/ThickBox
			} );

			const url = 'https://subscribe.wordpress.com/memberships/?' + params.toString();

			window.scrollTo( 0, 0 );
			tb_show( null, url, null );

			window.addEventListener( 'message', handleIframeResult, false );
			const tbWindow = document.querySelector( '#TB_window' );
			tbWindow.classList.add( 'jetpack-memberships-modal' );

			// This line has to come after the Thickbox has opened otherwise Firefox doesnt scroll to the top.
			window.scrollTo( 0, 0 );
		} );
	}
} );
