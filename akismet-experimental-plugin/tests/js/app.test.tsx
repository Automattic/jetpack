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
		// `@wordpress/components` 34 + `@wordpress/admin-ui` 2 emit a one-time
		// deprecation / experimental-API warning on first mount under React 19.
		// `@wordpress/jest-console` fails the test unless the warning is
		// acknowledged. The warning is benign — it's an internal API note,
		// not something our code triggers.

		expect( console ).toHaveWarned();
	} );

	it( 'renders the Overview, Activity, Account, and Settings tabs', () => {
		render( <App /> );
		expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /^activity$/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /account/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /settings/i } ) ).toBeInTheDocument();
	} );

	it( 'reads the initial tab from ?tab=activity', async () => {
		window.history.replaceState( null, '', '/?tab=activity' );
		render( <App /> );
		await waitFor( () =>
			expect( screen.getByRole( 'tab', { name: /^activity$/i } ) ).toHaveAttribute(
				'aria-selected',
				'true'
			)
		);
	} );

	it( 'defaults to the Overview tab as the first/landing tab', async () => {
		render( <App /> );
		await waitFor( () =>
			expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toHaveAttribute(
				'aria-selected',
				'true'
			)
		);
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

	it( 'reads the initial tab from ?tab=account', async () => {
		window.history.replaceState( null, '', '/?tab=account' );
		render( <App /> );
		await waitFor( () =>
			expect( screen.getByRole( 'tab', { name: /account/i } ) ).toHaveAttribute(
				'aria-selected',
				'true'
			)
		);
	} );

	it( 'ignores unknown ?tab= values and stays on Overview', async () => {
		window.history.replaceState( null, '', '/?tab=garbage' );
		render( <App /> );
		await waitFor( () =>
			expect( screen.getByRole( 'tab', { name: /overview/i } ) ).toHaveAttribute(
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
