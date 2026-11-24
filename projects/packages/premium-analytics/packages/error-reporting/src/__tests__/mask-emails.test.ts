import { maskEmails } from '../mask-emails';

describe( 'maskEmails', () => {
	it( 'masks an address whose local part fills the bound', () => {
		expect( maskEmails( `${ 'a'.repeat( 64 ) }@example.com` ) ).toBe( '[email]' );
	} );

	it( 'leaves no whole address when the local part is longer than the bound', () => {
		expect( maskEmails( `${ 'a'.repeat( 200 ) }@example.com` ) ).not.toContain( '@' );
	} );

	it( 'masks an address under a multi-label domain', () => {
		expect( maskEmails( 'jane@mail.corp.example.co.uk' ) ).toBe( '[email]' );
	} );

	it( 'masks an address under the longest top-level domain there is', () => {
		expect( maskEmails( 'jane@example.xn--vermgensberatung-pwa' ) ).toBe( '[email]' );
	} );

	it( 'leaves an at-sign whose domain carries no dot, which is not an address', () => {
		expect( maskEmails( 'connect failed for root@localhost' ) ).toBe(
			'connect failed for root@localhost'
		);
	} );

	it( 'returns a long run of text holding no address unchanged', () => {
		const text = '!'.repeat( 20000 );

		expect( maskEmails( text ) ).toBe( text );
	} );
} );
