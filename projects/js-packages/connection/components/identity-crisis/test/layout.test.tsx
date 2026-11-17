import { render, screen } from '@testing-library/react';
import IdentityCrisisLayout from '../layout';

describe( 'IdentityCrisisLayout', () => {
	it( 'renders a plugin logo URL as an image with the plugin alt text', () => {
		render(
			<IdentityCrisisLayout
				logo="https://example.com/logo.svg"
				customContent={ { logoAlt: 'Example plugin' } }
			>
				Content
			</IdentityCrisisLayout>
		);

		expect( screen.getByRole( 'img', { name: 'Example plugin' } ) ).toHaveAttribute(
			'src',
			'https://example.com/logo.svg'
		);
	} );
} );
