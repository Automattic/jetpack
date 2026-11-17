import { render, screen, within } from '@testing-library/react';
import PageBreadcrumbs from '../page-breadcrumbs';

jest.mock( '@wordpress/route', () => ( {
	useLinkProps: ( { to }: { to: string } ) => ( { href: `#${ to }` } ),
} ) );

describe( 'PageBreadcrumbs', () => {
	it( 'links back to Protect from a view below it', () => {
		const heading = 'Threats from your alert';
		render( <PageBreadcrumbs current={ heading } /> );

		expect(
			screen
				.queryAllByRole( 'link' )
				.map( link => [ link.textContent, link.getAttribute( 'href' ) ] )
		).toEqual( [ [ 'Protect', '#/' ] ] );
		expect( screen.getByRole( 'heading', { level: 1 } ) ).toHaveTextContent( heading );
		expect(
			within( screen.getByRole( 'navigation', { name: 'Breadcrumbs' } ) ).getByText( heading, {
				selector: '[aria-current="page"]',
			} )
		).toBeInTheDocument();
	} );
} );
