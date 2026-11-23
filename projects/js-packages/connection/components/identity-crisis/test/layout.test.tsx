import { render, screen } from '@testing-library/react';
import IdentityCrisisLayout from '../layout';

describe( 'IdentityCrisisLayout', () => {
	it( 'renders a logo URL as a decorative image', () => {
		render(
			<IdentityCrisisLayout logoUrl="https://example.com/logo.svg">Content</IdentityCrisisLayout>
		);

		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://example.com/logo.svg'
		);
	} );

	it.each( [
		[ true, 'Jetpack Connection is in Safe Mode' ],
		[ false, 'Jetpack Connection Safe Mode' ],
	] )( 'with the header %s, still names the region', ( showHeader, name ) => {
		render( <IdentityCrisisLayout showHeader={ showHeader }>Content</IdentityCrisisLayout> );

		expect( screen.getByRole( 'region', { name } ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'heading' ) !== null ).toBe( showHeader );
	} );
} );
