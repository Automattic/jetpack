import { render, screen, within } from '@testing-library/react';
import PageBreadcrumbs from '../page-breadcrumbs';

jest.mock( '@wordpress/route', () => ( {
	useLinkProps: ( { to }: { to: string } ) => ( { href: `#${ to }` } ),
} ) );

type TestWindow = { JetpackScriptData?: object };
const myJetpack = [ 'Jetpack', 'https://example.com/wp-admin/admin.php?page=my-jetpack' ];

describe( 'PageBreadcrumbs', () => {
	afterEach( () => {
		delete ( window as TestWindow ).JetpackScriptData;
	} );

	it.each( [
		[ 'links Jetpack to My Jetpack', true, undefined, [ myJetpack ], 'Protect' ],
		[
			'starts at Protect without My Jetpack',
			false,
			'Threats from your alert',
			[ [ 'Protect', '#/' ] ],
			'Threats from your alert',
		],
		[
			'links back to Protect from a view below it',
			true,
			'Threats from your alert',
			[ myJetpack, [ 'Protect', '#/' ] ],
			'Threats from your alert',
		],
	] )( '%s', ( _name, isAvailable, current, links, heading ) => {
		( window as TestWindow ).JetpackScriptData = {
			site: { admin_url: 'https://example.com/wp-admin/' },
			myJetpack: { isAvailable },
		};
		render( <PageBreadcrumbs current={ current } /> );

		expect(
			screen
				.queryAllByRole( 'link' )
				.map( link => [ link.textContent, link.getAttribute( 'href' ) ] )
		).toEqual( links );
		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( heading );
		expect(
			within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) ).getByText( heading, {
				selector: '[aria-current="page"]',
			} )
		).toBeInTheDocument();
	} );
} );
