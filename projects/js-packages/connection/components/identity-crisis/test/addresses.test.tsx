import { render, screen } from '@testing-library/react';
import IdentityCrisisAddresses from '../addresses';

describe( 'IdentityCrisisAddresses', () => {
	it.each( [
		[ 'move', 'From old.example to new.example' ],
		[ 'separate', 'old.example and new.example, connected separately' ],
	] as const )( 'names the WordPress.com address first for %s', ( variant, label ) => {
		render(
			<IdentityCrisisAddresses
				wpcomHomeUrl="old.example/"
				currentUrl="new.example/"
				variant={ variant }
			/>
		);

		expect( screen.getByRole( 'img', { name: label } ) ).toBeInTheDocument();
	} );

	it( 'renders nothing without both addresses', () => {
		const { container } = render(
			<IdentityCrisisAddresses wpcomHomeUrl="old.example/" variant="move" />
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
