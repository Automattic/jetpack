import { render, screen } from '@testing-library/react';
import { App } from '@/app';

describe( '<App>', () => {
	afterEach( () => {
		// @ts-expect-error - PHP injects the global at runtime; tests poke it.
		delete window.akismetExperimental;
	} );

	it( 'renders the Akismet page title', () => {
		render( <App /> );
		expect( screen.getByRole( 'heading', { name: /akismet/i, level: 1 } ) ).toBeInTheDocument();
	} );

	it( 'omits the Jetpack footer when Jetpack is not active', () => {
		render( <App /> );
		expect( screen.queryByRole( 'contentinfo' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the Jetpack footer when Jetpack is active', () => {
		(
			window as unknown as { akismetExperimental: { jetpackActive: boolean } }
		 ).akismetExperimental = {
			jetpackActive: true,
		};
		render( <App /> );
		expect( screen.getByRole( 'contentinfo' ) ).toBeInTheDocument();
	} );
} );
