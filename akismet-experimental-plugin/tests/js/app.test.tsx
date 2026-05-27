import { render, screen, waitFor } from '@testing-library/react';
import { App } from '@/app';
import { __resetApiClientMocks } from './mocks/api-client';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( './mocks/api-client' ) );

describe( '<App>', () => {
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => {
		// @ts-expect-error - PHP injects the global at runtime; tests poke it.
		delete window.akismetExperimental;
		// Reset any URL changes the tab-sync wrote.
		window.history.replaceState( null, '', '/' );
	} );

	it( 'renders the Akismet page title', () => {
		render( <App /> );
		expect( screen.getByRole( 'heading', { name: /akismet/i, level: 1 } ) ).toBeInTheDocument();
	} );

	it( 'renders the Account and Settings tabs', () => {
		render( <App /> );
		expect( screen.getByRole( 'tab', { name: /account/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /settings/i } ) ).toBeInTheDocument();
	} );

	it( 'reads the initial tab from ?tab=settings', async () => {
		window.history.replaceState( null, '', '/?tab=settings' );
		render( <App /> );
		await waitFor( () =>
			expect( screen.getByRole( 'tab', { name: /settings/i } ) ).toHaveAttribute(
				'aria-selected',
				'true'
			)
		);
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
