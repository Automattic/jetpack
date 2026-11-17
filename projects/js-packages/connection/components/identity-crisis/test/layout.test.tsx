import { render, screen } from '@testing-library/react';
import IdentityCrisisLayout from '../layout';

describe( 'IdentityCrisisLayout', () => {
	it( 'renders a logo URL as a decorative image', () => {
		render(
			<IdentityCrisisLayout logo="https://example.com/logo.svg">Content</IdentityCrisisLayout>
		);

		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute(
			'src',
			'https://example.com/logo.svg'
		);
	} );
} );
