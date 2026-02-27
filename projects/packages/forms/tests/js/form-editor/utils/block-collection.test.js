import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetCollections = jest.fn();
const mockRemoveBlockCollection = jest.fn();
const mockAddBlockCollection = jest.fn();

const mockSelect = jest.fn( () => ( {
	getCollections: mockGetCollections,
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	select: ( ...args ) => mockSelect( ...args ),
	dispatch: () => ( {
		removeBlockCollection: mockRemoveBlockCollection,
		addBlockCollection: mockAddBlockCollection,
	} ),
} ) );

const { removeJetpackBlockCollection, restoreJetpackBlockCollection } = await import(
	'../../../../src/form-editor/utils/block-collection'
);

describe( 'block-collection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockSelect.mockImplementation( () => ( {
			getCollections: mockGetCollections,
		} ) );
		// Reset module state between tests by restoring any saved collection
		restoreJetpackBlockCollection();
		jest.clearAllMocks();
		mockSelect.mockImplementation( () => ( {
			getCollections: mockGetCollections,
		} ) );
	} );

	describe( 'removeJetpackBlockCollection', () => {
		it( 'should remove the jetpack collection when it exists', () => {
			mockGetCollections.mockReturnValue( {
				jetpack: { title: 'Jetpack', icon: 'jetpack-icon' },
			} );

			removeJetpackBlockCollection();

			expect( mockRemoveBlockCollection ).toHaveBeenCalledWith( 'jetpack' );
		} );

		it( 'should not call removeBlockCollection when no jetpack collection exists', () => {
			mockGetCollections.mockReturnValue( {} );

			removeJetpackBlockCollection();

			expect( mockRemoveBlockCollection ).not.toHaveBeenCalled();
		} );

		it( 'should not call removeBlockCollection when getCollections is unavailable', () => {
			// Return a store object without getCollections
			mockSelect.mockReturnValue( {} );

			removeJetpackBlockCollection();

			expect( mockRemoveBlockCollection ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'restoreJetpackBlockCollection', () => {
		it( 'should restore a previously removed collection', () => {
			mockGetCollections.mockReturnValue( {
				jetpack: { title: 'Jetpack', icon: 'jetpack-icon' },
			} );

			removeJetpackBlockCollection();
			jest.clearAllMocks();

			restoreJetpackBlockCollection();

			expect( mockAddBlockCollection ).toHaveBeenCalledWith( 'jetpack', 'Jetpack', 'jetpack-icon' );
		} );

		it( 'should not call addBlockCollection when no collection was previously saved', () => {
			restoreJetpackBlockCollection();

			expect( mockAddBlockCollection ).not.toHaveBeenCalled();
		} );

		it( 'should only restore once after removal', () => {
			mockGetCollections.mockReturnValue( {
				jetpack: { title: 'Jetpack', icon: 'jetpack-icon' },
			} );

			removeJetpackBlockCollection();
			jest.clearAllMocks();

			restoreJetpackBlockCollection();
			restoreJetpackBlockCollection();

			expect( mockAddBlockCollection ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'removeJetpackBlockCollection and restoreJetpackBlockCollection', () => {
		it( 'should be reversible operations', () => {
			const collectionData = { title: 'Jetpack', icon: 'jetpack-icon' };
			mockGetCollections.mockReturnValue( { jetpack: collectionData } );

			removeJetpackBlockCollection();
			expect( mockRemoveBlockCollection ).toHaveBeenCalledWith( 'jetpack' );

			restoreJetpackBlockCollection();
			expect( mockAddBlockCollection ).toHaveBeenCalledWith(
				'jetpack',
				collectionData.title,
				collectionData.icon
			);
		} );
	} );
} );
