import { render, screen } from '@testing-library/react';
import IdentityCrisisAddresses from '../addresses';

describe( 'IdentityCrisisAddresses', () => {
	it.each( [
		[ 'move', 'From old.example to new.example' ],
		[ 'separate', 'old.example and new.example, connected separately' ],
	] as const )( 'names the WordPress.com address first for %s', ( variant, label ) => {
		render(
			<IdentityCrisisAddresses
				wpcomHomeUrl="https://old.example/"
				currentUrl="https://new.example"
				variant={ variant }
			/>
		);

		expect( screen.getByRole( 'img', { name: label } ) ).toBeInTheDocument();
	} );
} );
