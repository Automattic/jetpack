/**
 * Tests for `<EnterKeyStep>` — the form that posts to `/akismet/v1/key`.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnterKeyStep } from '@/routes/account/enter-key-step';
import { apiClient, __resetApiClientMocks } from '../../mocks/api-client';
import { createTestQueryClient } from '../../test-utils';
import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../../mocks/api-client' ) );

/**
 * Render `<EnterKeyStep>` inside a fresh QueryClientProvider.
 *
 * @param ui - React children.
 * @return The render result.
 */
function renderWith( ui: ReactNode ) {
	const client = createTestQueryClient();
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

/**
 * Flip allowMutations on for a single test; returns the matching cleanup.
 *
 * @return Cleanup function.
 */
function enableMutations(): () => void {
	(
		window as unknown as { akismetExperimental: { allowMutations: boolean } }
	 ).akismetExperimental = { allowMutations: true };
	return () => {
		// @ts-expect-error - cleanup
		delete window.akismetExperimental;
	};
}

describe( '<EnterKeyStep>', () => {
	let restore: () => void = () => {};
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => restore() );

	it( 'rejects an empty submission with a visible error', async () => {
		const onSuccess = jest.fn();
		renderWith( <EnterKeyStep onSuccess={ onSuccess } /> );
		await userEvent.click( screen.getByRole( 'button', { name: /use this key/i } ) );
		expect( ( await screen.findAllByText( /enter a key/i ) )[ 0 ] ).toBeInTheDocument();
		expect( onSuccess ).not.toHaveBeenCalled();
		expect( apiClient.post ).not.toHaveBeenCalled();
	} );

	it( 'short-circuits with a preview-mode notice when mutations are gated', async () => {
		const onSuccess = jest.fn();
		renderWith( <EnterKeyStep onSuccess={ onSuccess } /> );
		await userEvent.type( screen.getByLabelText( /api key/i ), 'abcdef123456' );
		await userEvent.click( screen.getByRole( 'button', { name: /use this key/i } ) );
		expect( ( await screen.findAllByText( /preview mode/i ) )[ 0 ] ).toBeInTheDocument();
		expect( apiClient.post ).not.toHaveBeenCalled();
		expect( onSuccess ).not.toHaveBeenCalled();
	} );

	it( 'submits a valid key and calls onSuccess', async () => {
		restore = enableMutations();
		const onSuccess = jest.fn();
		renderWith( <EnterKeyStep onSuccess={ onSuccess } /> );
		await userEvent.type( screen.getByLabelText( /api key/i ), 'abcdef123456' );
		await userEvent.click( screen.getByRole( 'button', { name: /use this key/i } ) );
		expect( ( await screen.findAllByText( /key connected/i ) )[ 0 ] ).toBeInTheDocument();
		expect( onSuccess ).toHaveBeenCalled();
		expect( apiClient.post ).toHaveBeenCalledWith( 'key', { key: 'abcdef123456' } );
	} );

	it( 'shows the server error on rejection (<6 chars triggers mock 400)', async () => {
		restore = enableMutations();
		renderWith( <EnterKeyStep onSuccess={ () => {} } /> );
		await userEvent.type( screen.getByLabelText( /api key/i ), 'bad' );
		await userEvent.click( screen.getByRole( 'button', { name: /use this key/i } ) );
		expect( ( await screen.findAllByText( /invalid key/i ) )[ 0 ] ).toBeInTheDocument();
	} );
} );
