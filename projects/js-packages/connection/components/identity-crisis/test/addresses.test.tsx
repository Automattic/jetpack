import { render } from '@testing-library/react';
import IdentityCrisisAddresses from '../addresses';

describe( 'IdentityCrisisAddresses', () => {
	it( 'shows the WordPress.com address before the one the site now loads at', () => {
		const { container } = render(
			<IdentityCrisisAddresses wpcomHomeUrl="old.example/" currentUrl="new.example/" isStore />
		);

		expect( container ).toHaveTextContent(
			'This store is registered with WordPress.com at old.example, but now loads at new.example.'
		);
	} );

	it( 'renders nothing without both addresses', () => {
		const { container } = render( <IdentityCrisisAddresses wpcomHomeUrl="old.example/" /> );

		expect( container ).toBeEmptyDOMElement();
	} );
} );
