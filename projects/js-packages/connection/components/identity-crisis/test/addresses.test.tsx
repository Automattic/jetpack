import { render, screen } from '@testing-library/react';
import IdentityCrisisAddresses from '../addresses';

describe( 'IdentityCrisisAddresses', () => {
	it( 'shows the WordPress.com address before the one the site now loads at', () => {
		render(
			<IdentityCrisisAddresses wpcomHomeUrl="old.example/" currentUrl="new.example/" isStore />
		);
		const labels = screen.getAllByRole( 'term' ).map( term => term.textContent );
		const addresses = screen.getAllByRole( 'definition' ).map( address => address.textContent );

		expect( labels ).toEqual( [
			'This store is registered with WordPress.com at',
			'It now loads at',
		] );
		expect( addresses ).toEqual( [ 'old.example', 'new.example' ] );
	} );

	it( 'renders nothing without both addresses', () => {
		const { container } = render( <IdentityCrisisAddresses wpcomHomeUrl="old.example/" /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
