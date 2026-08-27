/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';

const mockGetActions = jest.fn();
const mockNavigate = jest.fn();
const mockReceiveEntityRecords = jest.fn();

await jest.unstable_mockModule( '../../../../routes/responses/actions.tsx', () => ( {
	getActions: mockGetActions,
} ) );

await jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	useRegistry: () => ( {
		dispatch: () => ( { receiveEntityRecords: mockReceiveEntityRecords } ),
	} ),
} ) );

await jest.unstable_mockModule( '@wordpress/core-data', () => ( { store: 'core' } ) );

const { default: useResponseActions } = await import(
	'../../../../routes/response/use-response-actions.ts'
);
const { DEFAULT_PINNED_VIEW } = await import( '../../../../routes/response/pinned-view.ts' );

/**
 * A deferred promise, so a request can be held open across assertions.
 *
 * @return {object} The promise and its resolver.
 */
function deferred() {
	let resolve;
	const promise = new Promise( r => {
		resolve = r;
	} );
	return { promise, resolve };
}

const response = ( id, status = 'publish' ) => ( { id, status, is_unread: false } );

describe( 'useResponseActions', () => {
	let spamCalls;
	let pending;

	beforeEach( () => {
		jest.clearAllMocks();
		spamCalls = [];
		pending = [];

		const makeAction = () => ( {
			callback: jest.fn( items => {
				spamCalls.push( items[ 0 ].id );
				const d = deferred();
				pending.push( d );
				return d.promise;
			} ),
		} );

		mockGetActions.mockReturnValue( {
			markAsSpamAction: makeAction(),
			markAsNotSpamAction: makeAction(),
			moveToTrashAction: makeAction(),
			restoreAction: makeAction(),
			deleteAction: makeAction(),
			markAsReadAction: makeAction(),
			markAsUnreadAction: makeAction(),
			editFormAction: makeAction(),
		} );
	} );

	/**
	 * Render the hook for a given response.
	 *
	 * @param {object} record - The response.
	 * @return {object} The render result.
	 */
	function render( record ) {
		return renderHook( ( { r } ) => useResponseActions( r, DEFAULT_PINNED_VIEW ), {
			initialProps: { r: record },
		} );
	}

	it( 'blocks a second action on the same response while one is in flight', async () => {
		const { result } = render( response( 1 ) );

		act( () => result.current.markAsSpam() );
		act( () => result.current.moveToTrash() );

		expect( spamCalls ).toEqual( [ 1 ] );
	} );

	// The point of keying the guard by id: the user marks one response as spam and
	// immediately moves on, and the action they take on the next one must not be
	// swallowed by the first request still being open.
	it( 'allows an action on a different response while the first is still in flight', async () => {
		const { result, rerender } = render( response( 1 ) );

		act( () => result.current.markAsSpam() );
		expect( spamCalls ).toEqual( [ 1 ] );

		// The user navigates to the next response before the request lands.
		rerender( { r: response( 2 ) } );
		act( () => result.current.markAsSpam() );

		expect( spamCalls ).toEqual( [ 1, 2 ] );
	} );

	it( 'reports pending only for the response on screen', async () => {
		const { result, rerender } = render( response( 1 ) );

		act( () => result.current.markAsSpam() );
		expect( result.current.isPending ).toBe( true );

		rerender( { r: response( 2 ) } );
		expect( result.current.isPending ).toBe( false );
	} );

	it( 'frees the response for another action once the request settles', async () => {
		const { result } = render( response( 1 ) );

		act( () => result.current.markAsSpam() );
		await act( async () => {
			pending[ 0 ].resolve( { numberOfErrors: 1 } );
			await pending[ 0 ].promise;
		} );

		expect( result.current.isPending ).toBe( false );

		act( () => result.current.moveToTrash() );
		expect( spamCalls ).toEqual( [ 1, 1 ] );
	} );

	// Each shortcut is exposed unconditionally, unlike the menu which only renders
	// the items that apply to the current status.
	describe( 'status guards', () => {
		it( 'does not re-spam a response that is already spam', () => {
			const { result } = render( response( 1, 'spam' ) );
			act( () => result.current.markAsSpam() );
			expect( spamCalls ).toEqual( [] );
		} );

		it( 'does not spam a trashed response', () => {
			const { result } = render( response( 1, 'trash' ) );
			act( () => result.current.markAsSpam() );
			expect( spamCalls ).toEqual( [] );
		} );

		it( 'does not re-trash a trashed response', () => {
			const { result } = render( response( 1, 'trash' ) );
			act( () => result.current.moveToTrash() );
			expect( spamCalls ).toEqual( [] );
		} );

		it( 'only restores a trashed response', () => {
			const { result } = render( response( 1, 'publish' ) );
			act( () => result.current.restore() );
			expect( spamCalls ).toEqual( [] );
		} );
	} );

	it( 'returns to the list the response was opened from', () => {
		const { result } = renderHook( () =>
			useResponseActions( response( 1, 'spam' ), { status: 'spam' } )
		);

		act( () => result.current.goToList() );

		expect( mockNavigate ).toHaveBeenCalledWith( { to: '/responses/spam' } );
	} );

	// Leaving the page is a navigation the user did not ask for if they have already
	// moved on to a different response.
	it( 'does not navigate away after a delete the user has moved on from', async () => {
		const { result, rerender } = render( response( 1, 'trash' ) );

		let deleting;
		await act( async () => {
			deleting = result.current.deletePermanently();
		} );

		rerender( { r: response( 2, 'trash' ) } );

		await act( async () => {
			pending[ 0 ].resolve( { numberOfErrors: 0 } );
			await deleting;
		} );

		expect( mockNavigate ).not.toHaveBeenCalled();
	} );

	it( 'navigates away after a delete the user is still looking at', async () => {
		const { result } = render( response( 1, 'trash' ) );

		let deleting;
		await act( async () => {
			deleting = result.current.deletePermanently();
		} );

		await act( async () => {
			pending[ 0 ].resolve( { numberOfErrors: 0 } );
			await deleting;
		} );

		expect( mockNavigate ).toHaveBeenCalledWith( { to: '/responses/trash' } );
	} );
} );
