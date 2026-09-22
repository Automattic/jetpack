/* No jest-dom in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content */
import { act, render, screen } from '@testing-library/react';
import { DataSyncError } from '@automattic/jetpack-react-data-sync-client';
import CriticalCssProvider from './critical-css-context-provider';
import CriticalCssMeta from '../critical-css-meta/critical-css-meta';
import { runLocalGenerator } from '../lib/generate-critical-css';
import type { CriticalCssState } from '../lib/stores/critical-css-state-types';

let mockCssState: CriticalCssState;
const mockSetCssState = jest.fn();
const mockSetProviderErrors = jest.fn();

jest.mock( '../lib/stores/critical-css-state', () => ( {
	...jest.requireActual( '../lib/stores/critical-css-state' ),
	useCriticalCssState: () => [ mockCssState, mockSetCssState ],
	useProxyNonce: () => 'proxy-nonce',
	useSetProviderCssAction: () => ( { mutateAsync: jest.fn() } ),
	useSetProviderErrorsAction: () => ( { mutateAsync: mockSetProviderErrors } ),
	useRegenerateCriticalCssAction: () => ( { mutate: jest.fn() } ),
} ) );
jest.mock( '../lib/generate-critical-css', () => ( { runLocalGenerator: jest.fn() } ) );
jest.mock( '..', () => ( {
	RegenerateCriticalCssSuggestion: () => null,
	useRegenerationReason: () => [ { data: null } ],
} ) );
jest.mock( '../status/status', () => ( props: { cssState: CriticalCssState } ) => (
	<div data-testid="status">{ props.cssState.status_error }</div>
) );

const mockRunLocalGenerator = runLocalGenerator as jest.Mock;

function pendingState( created: number ): CriticalCssState {
	return {
		status: 'pending',
		created,
		providers: [
			{
				key: 'core_front_page',
				label: 'Front page',
				urls: [ '/' ],
				success_ratio: 1,
				status: 'pending',
			},
		],
	};
}

function mountMeta() {
	const view = render(
		<CriticalCssProvider>
			<CriticalCssMeta />
		</CriticalCssProvider>
	);
	return ( state: CriticalCssState ) => {
		mockCssState = state;
		view.rerender(
			<CriticalCssProvider>
				<CriticalCssMeta />
			</CriticalCssProvider>
		);
	};
}

function lastRunCallbacks() {
	return mockRunLocalGenerator.mock.calls.at( -1 )[ 2 ];
}

// A failed save through data-sync reverts its optimistic value, restoring the failed run's state.
async function failRunAndRollBack( showState: ( state: CriticalCssState ) => void, error: Error ) {
	const rolledBack = mockCssState;
	await act( async () => {
		lastRunCallbacks().onError( error );
		lastRunCallbacks().onFinished( false );
	} );
	showState( { providers: [], status: 'error', status_error: error.message } );
	showState( rolledBack );
}

describe( 'Local Critical CSS generator failures', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockCssState = pendingState( 100 );
		mockRunLocalGenerator.mockReturnValue( new AbortController() );
	} );

	it( 'does not restart a failed run when its error save rolls the state back', async () => {
		const showState = mountMeta();
		expect( mockRunLocalGenerator ).toHaveBeenCalledTimes( 1 );

		await failRunAndRollBack( showState, new Error( 'DS request failed: 500' ) );

		expect( mockRunLocalGenerator ).toHaveBeenCalledTimes( 1 );
		expect( screen.getByTestId( 'status' ).textContent ).toBe( 'DS request failed: 500' );
	} );

	it( 'runs a new generation request after a failed run', async () => {
		const showState = mountMeta();
		await failRunAndRollBack( showState, new Error( 'DS request failed: 500' ) );
		const runs = mockRunLocalGenerator.mock.calls.length;

		// Retrying requests regeneration: optimistic empty pending state, then the server's new request.
		showState( { status: 'pending', providers: [] } );
		showState( pendingState( 200 ) );

		expect( mockRunLocalGenerator ).toHaveBeenCalledTimes( runs + 1 );
		expect( screen.queryByTestId( 'status' ) ).toBeNull();
		expect( screen.getByText( /Generating Critical CSS/ ) ).not.toBeNull();
	} );

	it( 'shows one session-expired notice when a save is rejected with rest_cookie_invalid_nonce', async () => {
		const body = { code: 'rest_cookie_invalid_nonce', message: 'Cookie check failed' };
		const response = { status: 403, clone: () => ( { json: async () => body } ) };
		mockSetProviderErrors.mockRejectedValue(
			new DataSyncError( 'DS request failed: 403', {
				location: '/wp-json/jetpack-boost-ds/critical-css-state/action/set-provider-errors',
				status: 'response_not_ok',
				namespace: 'jetpack_boost_ds',
				key: 'critical_css_state',
				data: response,
			} )
		);
		const showState = mountMeta();

		const saveError = await lastRunCallbacks()
			.setProviderErrors( 'core_front_page', [] )
			.catch( ( error: Error ) => error );
		await failRunAndRollBack( showState, saveError );
		showState( pendingState( 100 ) );

		expect( mockRunLocalGenerator ).toHaveBeenCalledTimes( 1 );
		expect( mockSetCssState ).not.toHaveBeenCalled();
		expect( screen.getAllByText( 'Your session has expired' ) ).toHaveLength( 1 );
	} );
} );
