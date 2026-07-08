import { beforeEach, describe, expect, it, jest } from '@jest/globals';

const mockGetCollections = jest.fn();
const mockRemoveBlockCollection = jest.fn();
const mockAddBlockCollection = jest.fn();

const mockSelect = jest.fn( () => ( {
	getCollections: mockGetCollections,
} ) );

const mockDispatch = jest.fn( () => ( {
	removeBlockCollection: mockRemoveBlockCollection,
	addBlockCollection: mockAddBlockCollection,
} ) );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	select: ( ...args ) => mockSelect( ...args ),
	dispatch: ( ...args ) => mockDispatch( ...args ),
} ) );

const { removeJetpackBlockCollection, restoreJetpackBlockCollection } = await import(
	'../../../../src/form-editor/utils/block-collection'
);

const resetMocks = () => {
	jest.clearAllMocks();
	mockSelect.mockImplementation( () => ( {
		getCollections: mockGetCollections,
	} ) );
	mockDispatch.mockImplementation( () => ( {
		removeBlockCollection: mockRemoveBlockCollection,
		addBlockCollection: mockAddBlockCollection,
	} ) );
};

describe( 'block-collection', () => {
	beforeEach( () => {
		resetMocks();
		// Reset module state between tests by restoring any saved collection
		restoreJetpackBlockCollection();
		resetMocks();
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
			mockSelect.mockReturnValue( {} );

			removeJetpackBlockCollection();

			expect( mockRemoveBlockCollection ).not.toHaveBeenCalled();
		} );

		it( 'should not save state when removeBlockCollection is unavailable', () => {
			mockGetCollections.mockReturnValue( {
				jetpack: { title: 'Jetpack', icon: 'jetpack-icon' },
			} );
			// dispatch returns object without removeBlockCollection
			mockDispatch.mockReturnValue( {} );

			removeJetpackBlockCollection();
			resetMocks();

			// Restore should be a no-op since nothing was actually saved
			restoreJetpackBlockCollection();
			expect( mockAddBlockCollection ).not.toHaveBeenCalled();
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

		it( 'should preserve savedCollection when addBlockCollection is unavailable', () => {
			mockGetCollections.mockReturnValue( {
				jetpack: { title: 'Jetpack', icon: 'jetpack-icon' },
			} );
			removeJetpackBlockCollection();
			jest.clearAllMocks();

			// dispatch returns object without addBlockCollection
			mockDispatch.mockReturnValue( {} );
			restoreJetpackBlockCollection();

			expect( mockAddBlockCollection ).not.toHaveBeenCalled();

			// Restore the full dispatch mock — restore should still work
			resetMocks();
			restoreJetpackBlockCollection();

			expect( mockAddBlockCollection ).toHaveBeenCalledWith( 'jetpack', 'Jetpack', 'jetpack-icon' );
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
