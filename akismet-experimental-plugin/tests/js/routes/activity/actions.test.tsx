/**
 * Tripwire tests for `useActions` — verifies the preview-mode gate.
 *
 * The gate (GUARDRAILS.md §"Mutation gate") is a UX safety net, not a
 * security boundary. These tests assert the wiring: with allowMutations
 * off, no apiFetch is called and no parent invalidate fires; with it
 * on, both happen.
 *
 * `@wordpress/api-fetch` is mocked at the module boundary so we don't
 * have to set up a real fetch polyfill.
 */
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { useActions } from '@/routes/activity/actions';
import { createTestQueryClient } from '../../test-utils';
import type { ActivityRow } from '@/routes/activity/activity-types';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn().mockResolvedValue( { id: 1, status: 'approved' } ),
} ) );

// Mock the notices store so the preview-mode snackbar can be asserted
// without booting `@wordpress/data`. The real call is `void dispatch(
// noticesStore ).mockCreateNotice(...)` — we capture that call here.
const mockCreateNotice = jest.fn();
jest.mock( '@wordpress/data', () => ( {
	dispatch: () => ( { createNotice: mockCreateNotice } ),
} ) );
jest.mock( '@wordpress/notices', () => ( {
	store: 'core/notices',
} ) );

const mockedFetch = apiFetch as unknown as jest.Mock;

/**
 *
 */
function wrap() {
	const client = createTestQueryClient();
	return ( { children }: { children: ReactNode } ) => (
		<QueryClientProvider client={ client }>{ children }</QueryClientProvider>
	);
}

/**
 *
 * @param id
 */
function commentRow( id = 1 ): ActivityRow {
	return {
		id: `comment-${ id }`,
		timestamp: '2026-05-27T12:00:00Z',
		category: 'comments',
		source: 'akismet-content',
		outcome: 'block',
		subject: {
			kind: 'comment',
			label: `Spammer #${ id }`,
		},
		signals: [],
		ip: '203.0.113.5',
		visitor_id: null,
		context: { comment_id: id },
		preview: false,
	};
}

describe( 'useActions — mutation gate', () => {
	beforeEach( () => {
		mockedFetch.mockClear();
		mockCreateNotice.mockClear();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		delete ( window as any ).akismetExperimental;
	} );

	it( 'returns two comment-eligible actions', () => {
		const { result } = renderHook( () => useActions( jest.fn() ), { wrapper: wrap() } );
		expect( result.current.map( a => a.id ) ).toEqual( [ 'mark-as-ham', 'delete-permanently' ] );
		const markAsHam = result.current[ 0 ];
		expect( markAsHam.isEligible?.( commentRow() ) ).toBe( true );
	} );

	it( 'does NOT call apiFetch when allowMutations is false (default)', async () => {
		const invalidate = jest.fn();
		const { result } = renderHook( () => useActions( invalidate ), { wrapper: wrap() } );
		const action = result.current[ 0 ];
		expect( action.id ).toBe( 'mark-as-ham' );
		// @ts-expect-error -- DataViews ActionButton callback shape
		action.callback( [ commentRow( 1 ) ], {} );

		await new Promise( r => setTimeout( r, 20 ) );

		expect( mockedFetch ).not.toHaveBeenCalled();
		expect( invalidate ).not.toHaveBeenCalled();
		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'info',
			expect.stringContaining( 'Preview mode' ),
			expect.objectContaining( { type: 'snackbar' } )
		);
	} );

	it( 'DOES call apiFetch when allowMutations is true', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		( window as any ).akismetExperimental = { allowMutations: true };
		const invalidate = jest.fn();
		const { result } = renderHook( () => useActions( invalidate ), { wrapper: wrap() } );
		const action = result.current[ 0 ];
		// @ts-expect-error -- DataViews ActionButton callback shape
		action.callback( [ commentRow( 7 ), commentRow( 12 ) ], {} );

		await waitFor( () => expect( invalidate ).toHaveBeenCalledTimes( 1 ) );
		expect( mockedFetch ).toHaveBeenCalledTimes( 2 );
		expect( mockedFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/comments/7',
			method: 'POST',
			data: { status: 'approve' },
		} );
		expect( mockedFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/comments/12',
			method: 'POST',
			data: { status: 'approve' },
		} );
		expect( mockCreateNotice ).not.toHaveBeenCalled();
	} );

	it( 'delete action — same gate, different path', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		( window as any ).akismetExperimental = { allowMutations: true };
		const invalidate = jest.fn();
		const { result } = renderHook( () => useActions( invalidate ), { wrapper: wrap() } );
		const action = result.current[ 1 ];
		expect( action.id ).toBe( 'delete-permanently' );
		// @ts-expect-error -- DataViews ActionButton callback shape
		action.callback( [ commentRow( 9 ) ], {} );

		await waitFor( () => expect( invalidate ).toHaveBeenCalled() );
		expect( mockedFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/comments/9?force=true',
			method: 'DELETE',
		} );
	} );

	it( 'skips non-comment rows even when allowMutations is true', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		( window as any ).akismetExperimental = { allowMutations: true };
		const invalidate = jest.fn();
		const { result } = renderHook( () => useActions( invalidate ), { wrapper: wrap() } );
		const action = result.current[ 0 ];
		const loginRow: ActivityRow = {
			id: 'logins-1',
			timestamp: '2026-05-27T12:00:00Z',
			category: 'logins',
			source: 'blackbox-behavioral',
			outcome: 'block',
			subject: { kind: 'login-attempt', label: 'admin' },
			signals: [],
			context: {},
			preview: true,
		};
		// @ts-expect-error -- DataViews ActionButton callback shape
		action.callback( [ loginRow ], {} );

		await new Promise( r => setTimeout( r, 20 ) );
		expect( mockedFetch ).not.toHaveBeenCalled();
	} );
} );
