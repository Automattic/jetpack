import selectors from '../selectors';

describe( 'requests selectors', () => {
	describe( '#isRequestingPurchases', () => {
		it( 'should return False when no state', () => {
			const state = {};
			const output = selectors.isRequestingPurchases( state );
			expect( output ).toBe( false );
		} );

		it( 'should return False when no requesting according to state tree', () => {
			const state = {
				isRequestingPurchases: false,
			};

			const output = selectors.isRequestingPurchases( state );
			expect( output ).toBe( false );
		} );

		it( 'should return True when requesting according to state tree', () => {
			const state = {
				isRequestingPurchases: true,
			};

			const output = selectors.isRequestingPurchases( state );
			expect( output ).toBe( true );
		} );
	} );
} );
