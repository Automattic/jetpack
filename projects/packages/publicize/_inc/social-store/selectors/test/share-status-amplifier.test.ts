import { getPostShareStatus } from '../share-status';
import type { SocialStoreState } from '../../types';

// The "no share status yet" default must keep a stable reference, otherwise
// useSelect re-renders the whole share-status subtree on every store change.
describe( 'getPostShareStatus default reference', () => {
	const emptyState = { shareStatus: {} } as unknown as SocialStoreState;

	// Bind a stub registry; we pass an explicit postId so the editorStore fallback is skipped.
	beforeAll( () => {
		( getPostShareStatus as unknown as { registry: unknown } ).registry = {
			select: () => ( { getCurrentPostId: () => 0 } ),
		};
	} );

	it( 'returns an empty-shares object when the post has no status', () => {
		expect( getPostShareStatus( emptyState, 42 ) ).toEqual( { shares: [] } );
	} );

	it( 'returns a stable reference across calls', () => {
		expect( getPostShareStatus( emptyState, 42 ) ).toBe( getPostShareStatus( emptyState, 42 ) );
	} );

	it( 'returns the stored object when status exists', () => {
		const status = { shares: [ { timestamp: 1, status: 'success' } ] };
		const state = { shareStatus: { 42: status } } as unknown as SocialStoreState;

		expect( getPostShareStatus( state, 42 ) ).toBe( getPostShareStatus( state, 42 ) );
	} );
} );
