/**
 * External dependencies
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const mockUseEntityRecords = jest.fn();
const mockNavigate = jest.fn();

await jest.unstable_mockModule( '@wordpress/core-data', () => ( {
	useEntityRecords: mockUseEntityRecords,
} ) );

await jest.unstable_mockModule( '@wordpress/route', () => ( {
	useNavigate: () => mockNavigate,
} ) );

const { default: useResponsePageNavigation } = await import(
	'../../../../routes/response/use-navigation.ts'
);
const { DEFAULT_PINNED_VIEW } = await import( '../../../../routes/response/pinned-view.ts' );

const records = ( ...ids ) => ids.map( id => ( { id, status: 'publish' } ) );

/**
 * Render the hook against a given list of records.
 *
 * @param {number} currentId - The response being viewed.
 * @param {Array}  list      - The records the pinned query resolves to.
 * @param {object} [pinned]  - The pinned query.
 * @return {object} The render result.
 */
function render( currentId, list, pinned = DEFAULT_PINNED_VIEW ) {
	mockUseEntityRecords.mockReturnValue( { records: list } );
	return renderHook( ( { id, query } ) => useResponsePageNavigation( id, query ), {
		initialProps: { id: currentId, query: pinned },
	} );
}

describe( 'useResponsePageNavigation', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'navigates within the pinned list', () => {
		const { result } = render( 2, records( 1, 2, 3 ) );

		expect( result.current.hasPrevious ).toBe( true );
		expect( result.current.hasNext ).toBe( true );

		result.current.goNext();
		expect( mockNavigate ).toHaveBeenCalledWith( expect.objectContaining( { to: '/response/3' } ) );

		result.current.goPrevious();
		expect( mockNavigate ).toHaveBeenCalledWith( expect.objectContaining( { to: '/response/1' } ) );
	} );

	it( 'stops at the ends of the list', () => {
		expect( render( 1, records( 1, 2, 3 ) ).result.current.hasPrevious ).toBe( false );
		expect( render( 3, records( 1, 2, 3 ) ).result.current.hasNext ).toBe( false );
	} );

	it( 'queries the pinned list rather than a default one', () => {
		const pinned = { status: 'spam', search: 'urgent' };
		render( 2, records( 1, 2, 3 ), pinned );

		expect( mockUseEntityRecords ).toHaveBeenCalledWith( 'postType', 'feedback', pinned );
	} );

	it( 'carries the pinned list onto the next response', () => {
		const pinned = { ...DEFAULT_PINNED_VIEW, status: 'spam' };
		const { result } = render( 2, records( 1, 2, 3 ), pinned );

		result.current.goNext();

		expect( mockNavigate ).toHaveBeenCalledWith( {
			to: '/response/3',
			search: { view: pinned },
		} );
	} );

	// The regression this hook exists for: marking the open response as spam or
	// trash drops it out of an inbox list, and looking it up by id then finds
	// nothing.
	describe( 'once the response has left the list', () => {
		it( 'offers the response that took its place as next', () => {
			const { result, rerender } = render( 2, records( 1, 2, 3, 4 ) );

			expect( result.current.hasNext ).toBe( true );

			// Response 2 is actioned and the list refetches without it.
			mockUseEntityRecords.mockReturnValue( { records: records( 1, 3, 4 ) } );
			rerender( { id: 2, query: DEFAULT_PINNED_VIEW } );

			expect( result.current.hasNext ).toBe( true );
			expect( result.current.hasPrevious ).toBe( true );

			result.current.goNext();
			expect( mockNavigate ).toHaveBeenCalledWith(
				expect.objectContaining( { to: '/response/3' } )
			);

			result.current.goPrevious();
			expect( mockNavigate ).toHaveBeenCalledWith(
				expect.objectContaining( { to: '/response/1' } )
			);
		} );

		it( 'still offers next when it was the first in the list', () => {
			const { result, rerender } = render( 1, records( 1, 2, 3 ) );

			mockUseEntityRecords.mockReturnValue( { records: records( 2, 3 ) } );
			rerender( { id: 1, query: DEFAULT_PINNED_VIEW } );

			expect( result.current.hasPrevious ).toBe( false );
			expect( result.current.hasNext ).toBe( true );

			result.current.goNext();
			expect( mockNavigate ).toHaveBeenCalledWith(
				expect.objectContaining( { to: '/response/2' } )
			);
		} );

		it( 'offers only previous when it was the last in the list', () => {
			const { result, rerender } = render( 3, records( 1, 2, 3 ) );

			mockUseEntityRecords.mockReturnValue( { records: records( 1, 2 ) } );
			rerender( { id: 3, query: DEFAULT_PINNED_VIEW } );

			expect( result.current.hasNext ).toBe( false );
			expect( result.current.hasPrevious ).toBe( true );

			result.current.goPrevious();
			expect( mockNavigate ).toHaveBeenCalledWith(
				expect.objectContaining( { to: '/response/2' } )
			);
		} );

		it( 'offers nothing when it was the only response', () => {
			const { result, rerender } = render( 1, records( 1 ) );

			mockUseEntityRecords.mockReturnValue( { records: [] } );
			rerender( { id: 1, query: DEFAULT_PINNED_VIEW } );

			expect( result.current.hasNext ).toBe( false );
			expect( result.current.hasPrevious ).toBe( false );
		} );

		// The remembered position belongs to one response, not to the page.
		it( 'does not lend its position to a different response', () => {
			const { result, rerender } = render( 2, records( 1, 2, 3 ) );

			// Navigate to a response that isn't in the pinned list at all.
			mockUseEntityRecords.mockReturnValue( { records: records( 1, 2, 3 ) } );
			rerender( { id: 99, query: DEFAULT_PINNED_VIEW } );

			expect( result.current.hasNext ).toBe( false );
			expect( result.current.hasPrevious ).toBe( false );
		} );
	} );

	// Reported: spam a response, arrow down, spam the next one, then arrow back up —
	// you land on the first response you spammed (correct: prev/next walks the
	// sequence as it was), but from there both arrows are dead.
	//
	// The position has to be remembered per response, not just for the last one. A
	// single slot is overwritten as soon as you move on, so arriving back at a
	// response that has since left the list leaves it with no position at all.
	it( 'can still navigate after returning to an earlier spammed response', () => {
		const { result, rerender } = render( 2, records( 1, 2, 3, 4 ) );

		// Response 2 is spammed, but the list has not refetched yet.
		result.current.goNext();
		expect( mockNavigate ).toHaveBeenCalledWith( expect.objectContaining( { to: '/response/3' } ) );

		// Now on 3, still reading the un-refetched list.
		rerender( { id: 3, query: DEFAULT_PINNED_VIEW } );

		// Spam 3 too; the list now catches up and drops both.
		mockUseEntityRecords.mockReturnValue( { records: records( 1, 4 ) } );
		rerender( { id: 3, query: DEFAULT_PINNED_VIEW } );

		// Arrow back up lands on 2, which is spam. That part already worked.
		expect( result.current.hasPrevious ).toBe( true );
		result.current.goPrevious();
		expect( mockNavigate ).toHaveBeenCalledWith( expect.objectContaining( { to: '/response/2' } ) );

		rerender( { id: 2, query: DEFAULT_PINNED_VIEW } );

		// The regression: from 2 the arrows must still work.
		expect( result.current.hasNext ).toBe( true );
		expect( result.current.hasPrevious ).toBe( true );

		result.current.goNext();
		expect( mockNavigate ).toHaveBeenCalledWith( expect.objectContaining( { to: '/response/3' } ) );
	} );

	// A link straight to an already-spammed response has no position in the pinned
	// inbox and no remembered one, so guessing would put the user in a sequence the
	// response was never part of.
	it( 'offers no navigation for a response that was never in the list', () => {
		const { result } = render( 99, records( 1, 2, 3 ) );

		expect( result.current.hasNext ).toBe( false );
		expect( result.current.hasPrevious ).toBe( false );
	} );

	it( 'handles the list not having loaded yet', () => {
		const { result } = render( 2, null );

		expect( result.current.hasNext ).toBe( false );
		expect( result.current.hasPrevious ).toBe( false );
	} );
} );

// Every status change invalidates the pinned query, and `useEntityRecords` reports
// no records while it re-resolves. Going dead for the length of that refetch would
// strand the user exactly when they have just actioned a response and want to move
// on — the flow this whole feature exists to support.
describe( 'while the pinned list is refetching', () => {
	it( 'keeps navigating using the last known list', () => {
		const { result, rerender } = render( 2, records( 1, 2, 3 ) );

		expect( result.current.hasNext ).toBe( true );

		// The refetch is in flight: core-data reports nothing at all.
		mockUseEntityRecords.mockReturnValue( { records: null } );
		rerender( { id: 2, query: DEFAULT_PINNED_VIEW } );

		expect( result.current.hasNext ).toBe( true );
		expect( result.current.hasPrevious ).toBe( true );

		result.current.goNext();
		expect( mockNavigate ).toHaveBeenCalledWith( expect.objectContaining( { to: '/response/3' } ) );
	} );

	it( 'prefers the refreshed list once it lands', () => {
		const { result, rerender } = render( 2, records( 1, 2, 3 ) );

		mockUseEntityRecords.mockReturnValue( { records: null } );
		rerender( { id: 2, query: DEFAULT_PINNED_VIEW } );

		// Response 2 was spammed, so the refreshed list no longer contains it.
		mockUseEntityRecords.mockReturnValue( { records: records( 1, 3, 4 ) } );
		rerender( { id: 2, query: DEFAULT_PINNED_VIEW } );

		result.current.goNext();
		expect( mockNavigate ).toHaveBeenCalledWith( expect.objectContaining( { to: '/response/3' } ) );
	} );
} );
