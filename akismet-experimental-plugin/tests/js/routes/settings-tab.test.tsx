/**
 * Tests for `<SettingsTab>` — strictness + show-approved-comments controls.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsTab } from '@/routes/settings-tab';
import { __resetApiClientMocks } from '../mocks/api-client';
import { createTestQueryClient } from '../test-utils';
import type { ReactNode } from 'react';

// eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factory must use CJS require; it runs at hoist time.
jest.mock( '@/lib/api-client', () => require( '../mocks/api-client' ) );

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

/**
 * Render with a fresh QueryClient.
 *
 * @param ui - React children.
 * @return The render result.
 */
function renderWith( ui: ReactNode ) {
	const client = createTestQueryClient();
	return render( <QueryClientProvider client={ client }>{ ui }</QueryClientProvider> );
}

describe( '<SettingsTab>', () => {
	let restore: () => void = () => {};
	beforeEach( () => __resetApiClientMocks() );
	afterEach( () => restore() );

	it( 'renders the strictness options and show-approved toggle', async () => {
		renderWith( <SettingsTab /> );
		await expect( screen.findByLabelText( /silently discard/i ) ).resolves.toBeInTheDocument();
		expect( screen.getByLabelText( /always put spam/i ) ).toBeInTheDocument();
		expect( screen.getByLabelText( /show the number of approved/i ) ).toBeInTheDocument();
	} );

	it( 'persists the strictness change after the mutation resolves', async () => {
		restore = enableMutations();
		renderWith( <SettingsTab /> );
		const silentRadio = await screen.findByLabelText( /silently discard/i );
		await userEvent.click( silentRadio );
		await expect( screen.findByLabelText( /silently discard/i ) ).resolves.toBeChecked();
	} );

	it( 'shows the preview-mode notice when mutations are gated', async () => {
		renderWith( <SettingsTab /> );
		const silentRadio = await screen.findByLabelText( /silently discard/i );
		await userEvent.click( silentRadio );
		expect( ( await screen.findAllByText( /preview mode/i ) )[ 0 ] ).toBeInTheDocument();
	} );
} );
