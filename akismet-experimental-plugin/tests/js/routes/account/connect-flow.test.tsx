/**
 * Smoke tests for `<ConnectFlow>` — the stepper that fans out to
 * <EnterKeyStep> and <ConnectJetpackStep>.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectFlow } from '@/routes/account/connect-flow';
import { __resetApiClientMocks } from '../../mocks/api-client';
import { createTestQueryClient } from '../../test-utils';
import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../../mocks/api-client' ) );

/**
 * Render `<ConnectFlow>` with a fresh QueryClient.
 *
 * @param ui - React children.
 * @return The render result.
 */
function renderWith( ui: ReactNode ) {
	const client = createTestQueryClient();
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

describe( '<ConnectFlow>', () => {
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => {
		// @ts-expect-error - cleanup
		delete window.akismetExperimental;
	} );

	it( 'shows the chooser by default with two paths when Jetpack is off', () => {
		renderWith( <ConnectFlow onSuccess={ () => {} } /> );
		expect( screen.getByRole( 'button', { name: /i already have a key/i } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: /get a new key/i } ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: /connect with jetpack/i } )
		).not.toBeInTheDocument();
	} );

	it( 'surfaces the Jetpack path when Jetpack is active', () => {
		(
			window as unknown as { akismetExperimental: { jetpackActive: boolean } }
		 ).akismetExperimental = {
			jetpackActive: true,
		};
		renderWith( <ConnectFlow onSuccess={ () => {} } /> );
		expect( screen.getByRole( 'button', { name: /connect with jetpack/i } ) ).toBeInTheDocument();
	} );

	it( 'navigates into the existing-key step and back', async () => {
		renderWith( <ConnectFlow onSuccess={ () => {} } /> );
		await userEvent.click( screen.getByRole( 'button', { name: /i already have a key/i } ) );
		expect( screen.getByLabelText( /api key/i ) ).toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: /go back/i } ) );
		expect( screen.getByRole( 'button', { name: /i already have a key/i } ) ).toBeInTheDocument();
	} );
} );
