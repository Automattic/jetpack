import {
	removeJetpackBlockCollection,
	restoreJetpackBlockCollection,
} from '../../../../src/form-editor/utils/block-collection';

const mockGetCollections = jest.fn();
const mockRemoveBlockCollection = jest.fn();
const mockAddBlockCollection = jest.fn();

jest.mock( '@wordpress/data', () => ( {
	select: () => ( {
		getCollections: mockGetCollections,
	} ),
	dispatch: () => ( {
		removeBlockCollection: mockRemoveBlockCollection,
		addBlockCollection: mockAddBlockCollection,
	} ),
} ) );

describe( 'block-collection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		// Reset module state between tests by restoring any saved collection
		restoreJetpackBlockCollection();
		jest.clearAllMocks();
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
			mockGetCollections.mockImplementation( () => {
				throw new Error( 'not a function' );
			} );

			// Override select to return an object without getCollections
			const dataModule = require( '@wordpress/data' );
			const originalSelect = dataModule.select;
			dataModule.select = () => ( {} );

			removeJetpackBlockCollection();

			expect( mockRemoveBlockCollection ).not.toHaveBeenCalled();

			dataModule.select = originalSelect;
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
