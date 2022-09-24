/* global tb_show, tb_remove */

import './view.scss';
import '../../shared/memberships.scss';
import domReady from '@wordpress/dom-ready';

domReady( function () {
	const form = document.querySelector( '.jetpack_subscription_widget form' );
	if ( ! form.payments_attached ) {
		form.payments_attached = true;
		form.addEventListener( 'submit', function ( event ) {
			if ( form.resubmitted ) {
				return;
			}
			event.preventDefault();
			const url =
				'https://subscribe.wordpress.com/memberships/?blog=' +
				form.dataset.blog +
				'&plan=all&source=jetpack_subscribe&design=alternate';
			window.scrollTo( 0, 0 );
			tb_show( null, url + '&TB_iframe=true', null );
			const handleIframeResult = function ( eventFromIframe ) {
				if (
					eventFromIframe.origin === 'https://subscribe.wordpress.com' &&
					eventFromIframe.data
				) {
					const data = JSON.parse( eventFromIframe.data );
					if ( data && data.action === 'close' ) {
						window.removeEventListener( 'message', handleIframeResult );
						tb_remove();
					} else if ( data && data.action === 'jetpack_subscribe_continue' ) {
						form.resubmitted = true;
						form.submit();
					}
				}
			};
			window.addEventListener( 'message', handleIframeResult, false );
			const tbWindow = document.querySelector( '#TB_window' );
			tbWindow.classList.add( 'jetpack-memberships-modal' );

			// This line has to come after the Thickbox has opened otherwise Firefox doesnt scroll to the top.
			window.scrollTo( 0, 0 );
		} );
	}
} );
