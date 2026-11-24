import { readStripeReturn, withoutStripeReturn } from '../return-notice';

const PAGE = 'https://example.com/wp-admin/admin.php?page=jetpack-monetize&p=%2F%3Ftab%3Dpayments';

describe( 'readStripeReturn', () => {
	it.each( [
		[ '&stripe_connect_success=gutenberg', 'connected' ],
		[ '&stripe_connect_cancelled=1', 'cancelled' ],
		[ '', null ],
	] )(
		'reads %s from the URL WordPress.com returns to, and the rest keeps the tab',
		( added, result ) => {
			expect( readStripeReturn( PAGE + added ) ).toBe( result );
			expect( withoutStripeReturn( PAGE + added ) ).toBe( PAGE );
		}
	);
} );
