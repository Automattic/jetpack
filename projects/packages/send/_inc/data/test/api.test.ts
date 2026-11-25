import { errorMessage } from '../api';

describe( 'errorMessage', () => {
	it.each( [
		[
			'WordPress’s fatal error page, without its tags or link',
			'<p>There has been a critical error on this website.</p><p><a href="https://wordpress.org/documentation/article/faq-troubleshooting/">Learn more about troubleshooting WordPress.</a></p>',
			'There has been a critical error on this website.',
		],
		[
			'entities, decoded',
			'We couldn&#8217;t reach it &amp; gave up &#x2014; try again.',
			'We couldn’t reach it & gave up — try again.',
		],
		[
			'a plain message, as it is',
			'The sending account could not be created.',
			'The sending account could not be created.',
		],
		[
			'an address in angle brackets, kept',
			'Check this address: Jo <jo@example.com>',
			'Check this address: Jo <jo@example.com>',
		],
		[
			'any tag, comment or unfinished tag, without the markup',
			'<h1>Failed</h1><!-- note --><script>x</script> <img src=x onerror=alert(1)> at <b',
			'Failed x at',
		],
		[
			'a message that was only a link, as the fallback',
			'<p><a href="#">Learn more.</a></p>',
			'Something went wrong. Please try again.',
		],
	] )( 'reads %s', ( _, message, expected ) => {
		expect(
			errorMessage( { code: 'internal_server_error', message, data: { status: 500 } } )
		).toBe( expected );
	} );

	it( 'reads a huge message quickly', () => {
		const start = Date.now();
		const message = errorMessage( { message: '<a>'.repeat( 40000 ) + 'Too big.' } );
		expect( Date.now() - start ).toBeLessThan( 500 );
		expect( message ).toBe( 'Something went wrong. Please try again.' );
	} );

	it( 'falls back when there is no message', () => {
		expect( errorMessage( null ) ).toBe( 'Something went wrong. Please try again.' );
	} );
} );
