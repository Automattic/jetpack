import jetpackModulesSelectors from '../selectors';

describe( 'jetpackModulesSelectors', () => {
	const state = {
		data: {
			module1: {
				activated: true,
			},
			module2: {
				activated: false,
			},
		},
		isLoading: false,
		isUpdating: {
			module1: false,
			module2: true,
		},
	};

	describe( 'getJetpackModules', () => {
		test( 'returns the jetpack modules data from the state', () => {
			expect( jetpackModulesSelectors.getJetpackModules( state ) ).toEqual( state.data );
		} );
	} );

	describe( 'isModuleActive', () => {
		test( 'returns true if the module is active', () => {
			expect( jetpackModulesSelectors.isModuleActive( state, 'module1' ) ).toBe( true );
		} );

		test( 'returns false if the module is not active', () => {
			expect( jetpackModulesSelectors.isModuleActive( state, 'module2' ) ).toBe( false );
		} );

		test( 'returns false if the module does not exist in the state', () => {
			expect( jetpackModulesSelectors.isModuleActive( state, 'module3' ) ).toBe( false );
		} );
	} );

	describe( 'areModulesLoading', () => {
		test( 'returns false if the modules are not loading', () => {
			expect( jetpackModulesSelectors.areModulesLoading( state ) ).toBe( false );
		} );

		test( 'returns true if the modules are loading', () => {
			const loadingState = {
				...state,
				isLoading: true,
			};
			expect( jetpackModulesSelectors.areModulesLoading( loadingState ) ).toBe( true );
		} );
	} );

	describe( 'isModuleUpdating', () => {
		test( 'returns false if the module is not updating', () => {
			expect( jetpackModulesSelectors.isModuleUpdating( state, 'module1' ) ).toBe( false );
		} );

		test( 'returns true if the module is updating', () => {
			expect( jetpackModulesSelectors.isModuleUpdating( state, 'module2' ) ).toBe( true );
		} );

		test( 'returns false if the module does not exist in the updating state', () => {
			expect( jetpackModulesSelectors.isModuleUpdating( state, 'module3' ) ).toBe( false );
		} );
	} );
} );
