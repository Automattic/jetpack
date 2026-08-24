/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

// Mocks must be registered before importing the hook under test.
const markResponseAsRead = jest.fn();
const editEntityRecord = jest.fn();

await jest.unstable_mockModule( '../../../../src/dashboard/inbox/mark-as-read', () => ( {
	markResponseAsRead,
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useDispatch: jest.fn( () => ( { editEntityRecord } ) ),
} ) );

/**
 * Internal dependencies
 */
const useMarkAsReadOnView = (
	await import( '../../../../src/dashboard/hooks/use-mark-as-read-on-view' )
).default;

describe( 'useMarkAsReadOnView', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'does nothing while the response is null (still loading)', () => {
		renderHook( () => useMarkAsReadOnView( null ) );

		expect( markResponseAsRead ).not.toHaveBeenCalled();
	} );

	it( 'does not mark a response that is already read', () => {
		renderHook( () => useMarkAsReadOnView( { id: 5, is_unread: false, status: 'publish' } ) );

		expect( markResponseAsRead ).not.toHaveBeenCalled();
	} );

	it( 'marks an unread response as read on first view', () => {
		const onSuccess = jest.fn();
		const response = { id: 7, is_unread: true, status: 'publish' };

		renderHook( () => useMarkAsReadOnView( response, onSuccess ) );

		expect( markResponseAsRead ).toHaveBeenCalledTimes( 1 );
		expect( markResponseAsRead ).toHaveBeenCalledWith( response, editEntityRecord, onSuccess );
	} );

	it( 'marks an unread response at most once across re-renders of the same id', () => {
		const response = { id: 7, is_unread: true, status: 'publish' };
		const { rerender } = renderHook( props => useMarkAsReadOnView( props ), {
			initialProps: response,
		} );

		// A store update flips is_unread to false, producing a new response object
		// for the same id — the hook must not fire a second request.
		rerender( { id: 7, is_unread: false, status: 'publish' } );

		expect( markResponseAsRead ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does not re-mark an already-read response when it is manually set back to unread', () => {
		// Open a response that was already read: the id is latched but no request fires.
		const { rerender } = renderHook( props => useMarkAsReadOnView( props ), {
			initialProps: { id: 9, is_unread: false, status: 'publish' },
		} );

		expect( markResponseAsRead ).not.toHaveBeenCalled();

		// "Mark as unread" flips is_unread back to true on the open response.
		// Because the id was latched on the first view, the hook must not bounce
		// it back to read.
		rerender( { id: 9, is_unread: true, status: 'publish' } );

		expect( markResponseAsRead ).not.toHaveBeenCalled();
	} );

	it( 'marks a different response when navigating to a new unread id', () => {
		const first = { id: 1, is_unread: true, status: 'publish' };
		const second = { id: 2, is_unread: true, status: 'publish' };
		const { rerender } = renderHook( props => useMarkAsReadOnView( props ), {
			initialProps: first,
		} );

		rerender( second );

		expect( markResponseAsRead ).toHaveBeenCalledTimes( 2 );
		expect( markResponseAsRead ).toHaveBeenNthCalledWith( 1, first, editEntityRecord, undefined );
		expect( markResponseAsRead ).toHaveBeenNthCalledWith( 2, second, editEntityRecord, undefined );
	} );
} );
