import './view.scss';
import '../../shared/memberships.scss';
import domReady from '@wordpress/dom-ready';
import { show_modal_retrieve_subscriptions_from_email } from '../../shared/memberships';

domReady( function () {
	const link = document.querySelector( '#jp_retrieve_subscriptions_link' );
	if ( link && link.dataset.blog_id ) {
		link.addEventListener( 'click', function ( event ) {
			event.preventDefault();
			// get the email from the form
			show_modal_retrieve_subscriptions_from_email( link.dataset.blog_id, null );
		} );
	}
} );
