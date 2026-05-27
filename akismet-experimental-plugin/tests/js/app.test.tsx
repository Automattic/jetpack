import { render, screen } from '@testing-library/react';
import { App } from '@/app';

describe( '<App>', () => {
	it( 'renders the Akismet page title', () => {
		render( <App /> );
		expect( screen.getByRole( 'heading', { name: /akismet/i, level: 1 } ) ).toBeInTheDocument();
	} );
} );
