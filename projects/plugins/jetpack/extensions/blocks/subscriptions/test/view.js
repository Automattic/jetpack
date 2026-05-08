import domReady from '@wordpress/dom-ready';
import { showModal } from '../../../shared/memberships';

jest.mock( '@wordpress/dom-ready', () => jest.fn() );

jest.mock( '../../../shared/memberships', () => ( {
	showModal: jest.fn( () => Promise.resolve() ),
	spinner: '<span class="jetpack-memberships-spinner"></span>',
} ) );

describe( 'Subscriptions frontend view', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		jest.clearAllMocks();
	} );

	test( 'passes the custom success message to the subscription modal', () => {
		document.body.innerHTML = `
			<div class="wp-block-jetpack-subscriptions__container">
				<form data-blog="123" data-post_access_level="everybody" data-subscriber_email="">
					<input type="email" value="reader@example.com" />
					<input type="hidden" name="action" value="subscribe" />
					<input type="hidden" name="post_id" value="456" />
					<input type="hidden" name="tier_id" value="" />
					<input type="hidden" name="app_source" value="subscribe-block" />
					<input type="hidden" name="selected_newsletter_categories" value="1,2" />
					<input type="hidden" name="success_message" value="Custom subscription success." />
					<button type="submit">Subscribe</button>
				</form>
			</div>
		`;

		require( '../view' );
		domReady.mock.calls[ 0 ][ 0 ]();

		document.querySelector( 'form' ).dispatchEvent(
			new Event( 'submit', {
				bubbles: true,
				cancelable: true,
			} )
		);

		const modalUrl = showModal.mock.calls[ 0 ][ 0 ];
		const params = new URL( modalUrl ).searchParams;

		expect( params.get( 'success_message' ) ).toBe( 'Custom subscription success.' );
	} );
} );
