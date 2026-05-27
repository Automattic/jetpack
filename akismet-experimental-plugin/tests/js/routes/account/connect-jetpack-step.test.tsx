/**
 * Tests for `<ConnectJetpackStep>` — the GET-/akismet/v1/jetpack-key button.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectJetpackStep } from '@/routes/account/connect-jetpack-step';
import { apiClient, __resetApiClientMocks } from '../../mocks/api-client';
import { createTestQueryClient } from '../../test-utils';
import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../../mocks/api-client' ) );

/**
 * Set `window.akismetExperimental` for a single test. Returns the cleanup.
 *
 * @param payload                - Partial global to assign.
 * @param payload.jetpackActive
 * @param payload.allowMutations
 * @return Cleanup function.
 */
function withGlobal( payload: { jetpackActive?: boolean; allowMutations?: boolean } ): () => void {
	( window as unknown as { akismetExperimental: typeof payload } ).akismetExperimental = payload;
	return () => {
		// @ts-expect-error - cleanup
		delete window.akismetExperimental;
	};
}

/**
 * Render `<ConnectJetpackStep>` inside a fresh QueryClientProvider.
 *
 * @param ui - The component to render.
 * @return The render result.
 */
function renderWith( ui: ReactNode ) {
	const client = createTestQueryClient();
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

describe( '<ConnectJetpackStep>', () => {
	let restore: () => void = () => {};
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => restore() );

	it( 'renders nothing when Jetpack is not active', () => {
		const { container } = renderWith( <ConnectJetpackStep onSuccess={ () => {} } /> );
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'shows the button when Jetpack is active', () => {
		restore = withGlobal( { jetpackActive: true } );
		renderWith( <ConnectJetpackStep onSuccess={ () => {} } /> );
		expect( screen.getByRole( 'button', { name: /connect with jetpack/i } ) ).toBeInTheDocument();
	} );

	it( 'surfaces "no jetpack-connected user" when the server says so', async () => {
		restore = withGlobal( { jetpackActive: true } );
		( apiClient.get as jest.Mock ).mockRejectedValueOnce( {
			code: 'no_jetpack_user',
			message: 'No Jetpack-connected user with an Akismet key was found.',
			data: { status: 400 },
		} );
		const onSuccess = jest.fn();
		renderWith( <ConnectJetpackStep onSuccess={ onSuccess } /> );
		await userEvent.click( screen.getByRole( 'button', { name: /connect with jetpack/i } ) );
		expect(
			( await screen.findAllByText( /no jetpack-connected user/i ) )[ 0 ]
		).toBeInTheDocument();
		expect( onSuccess ).not.toHaveBeenCalled();
	} );

	it( 'succeeds when Jetpack returns a valid key', async () => {
		restore = withGlobal( { jetpackActive: true } );
		( apiClient.get as jest.Mock ).mockResolvedValueOnce( {
			key: 'jpkey-abcdef12',
			valid: true,
		} );
		const onSuccess = jest.fn();
		renderWith( <ConnectJetpackStep onSuccess={ onSuccess } /> );
		await userEvent.click( screen.getByRole( 'button', { name: /connect with jetpack/i } ) );
		expect( ( await screen.findAllByText( /jetpack key connected/i ) )[ 0 ] ).toBeInTheDocument();
		expect( onSuccess ).toHaveBeenCalled();
	} );
} );
