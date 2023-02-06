import {
	isFetchingModulesList,
	isActivatingModule,
	isDeactivatingModule,
	isUpdatingModuleOption,
	getModules,
	getModule,
	isModuleActivated,
	getModuleOverride,
	isModuleForcedActive,
	isModuleForcedInactive,
	hasAnyOfTheseModules,
	hasAnyPerformanceFeature,
	hasAnySecurityFeature,
} from '../reducer';

const state = {
	jetpack: {
		modules: {
			items: {
				'module-a': {
					module: 'module-a',
					activated: false,
					override: 'active',
				},
				'module-b': {
					module: 'module-b',
					activated: true,
					options: {
						c: {
							currentValue: 2,
						},
					},
					override: 'inactive',
				},
				'module-c': {
					module: 'module-c',
					activated: false,
					override: false,
				},
			},
			requests: {
				fetchingModulesList: true,
				activating: {
					'module-a': true,
				},
				deactivating: {
					'module-b': true,
				},
				updatingOption: {
					'module-c': {
						n_per_minute: true,
					},
				},
			},
		},
	},
};

describe( 'requests selectors', () => {
	describe( '#isFetchingModulesList', () => {
		test( 'should return state.jetpack.modules.requests.fetchingModulesList', () => {
			const stateIn = state;
			const output = isFetchingModulesList( stateIn );
			expect( output ).toBe( true );
		} );
	} );

	describe( '#isActivatingModule', () => {
		test( 'should return state.jetpack.modules.requests.activating[ module_slug ]', () => {
			const stateIn = state;
			const output = isActivatingModule( stateIn, 'module-a' );
			expect( output ).toBe( true );
		} );
	} );

	describe( '#isDeactivatingModule', () => {
		test( 'should return state.jetpack.modules.requests.deactivating[ module_slug ]', () => {
			const stateIn = state;
			const output = isDeactivatingModule( stateIn, 'module-b' );
			expect( output ).toBe( true );
		} );
	} );

	describe( '#isUpdatingModuleOption', () => {
		test( 'should return state.jetpack.modules.requests.updatingOpton[ module_slug ][ option_name ]', () => {
			const stateIn = state;
			const output = isUpdatingModuleOption( stateIn, 'module-c', 'n_per_minute' );
			expect( output ).toBe( true );
		} );
	} );
} );

describe( 'items selectors', () => {
	describe( '#getModules', () => {
		test( 'should return state.jetpack.modules.items', () => {
			const stateIn = state;
			const output = getModules( stateIn );
			expect( output ).toEqual( stateIn.jetpack.modules.items );
		} );
	} );

	describe( '#getModule', () => {
		test( 'should return state.jetpack.modules.items[ module_slug ]', () => {
			const stateIn = state;
			const output = getModule( stateIn, 'module-a' );
			expect( output ).toEqual( stateIn.jetpack.modules.items[ 'module-a' ] );
		} );
	} );

	describe( '#isModuleActivated', () => {
		test( 'should return state.jetpack.modules.items[ module_slug ].activated', () => {
			const stateIn = state;
			const output = isModuleActivated( stateIn, 'module-a' );
			expect( output ).toEqual( stateIn.jetpack.modules.items[ 'module-a' ].activated );
		} );
	} );

	describe( '#getModuleOverride', () => {
		test( 'should return active when module forced on', () => {
			expect( getModuleOverride( state, 'module-a' ) ).toBe( 'active' );
		} );

		test( 'should return inactive when module forced off', () => {
			expect( getModuleOverride( state, 'module-b' ) ).toBe( 'inactive' );
		} );

		test( 'should return false when module not overriden', () => {
			expect( getModuleOverride( state, 'module-c' ) ).toBe( false );
		} );
	} );

	describe( '#isModuleForcedActive', () => {
		test( 'should return true when module forced on', () => {
			expect( isModuleForcedActive( state, 'module-a' ) ).toBe( true );
		} );

		test( 'should return false when module not overriden', () => {
			expect( getModuleOverride( state, 'module-c' ) ).toBe( false );
		} );
	} );

	describe( '#isModuleForcedInactive', () => {
		test( 'should return true when module forced off', () => {
			expect( isModuleForcedInactive( state, 'module-b' ) ).toBe( true );
		} );

		test( 'should return false when module not overriden', () => {
			expect( isModuleForcedInactive( state, 'module-c' ) ).toBe( false );
		} );
	} );

	describe( '#hasAnyOfTheseModules', () => {
		test( 'should return true when at least one of the passed modules is available', () => {
			expect( hasAnyOfTheseModules( state, [ 'module-b' ] ) ).toBe( true );
		} );

		test( 'should return false when none of the passed modules is available', () => {
			expect( hasAnyOfTheseModules( state, [ 'module-d' ] ) ).toBe( false );
		} );
	} );

	describe( '#hasAnyPerformanceFeature', () => {
		test( 'should return true when at least one of the performance modules is available', () => {
			const stateIn = {
				jetpack: {
					modules: {
						items: {
							'lazy-images': {},
						},
					},
				},
			};
			expect( hasAnyPerformanceFeature( stateIn ) ).toBe( true );
		} );

		test( 'should return false when at least one of the performance modules is available', () => {
			const stateIn = {
				jetpack: {
					modules: {
						items: {},
					},
				},
			};
			expect( hasAnyPerformanceFeature( stateIn ) ).toBe( false );
		} );
	} );

	describe( '#hasAnySecurityFeature', () => {
		test( 'should return true when none of the performance modules is available', () => {
			const stateIn = {
				jetpack: {
					modules: {
						items: {
							protect: {},
						},
					},
					pluginsData: {
						items: {
							'akismet/akismet.php': {
								active: false,
							},
						},
					},
				},
			};
			expect( hasAnySecurityFeature( stateIn ) ).toBe( true );
		} );

		test( 'should return true when at least the Akismet plugin is active', () => {
			const stateIn = {
				jetpack: {
					modules: {
						items: {},
					},
					pluginsData: {
						items: {
							'akismet/akismet.php': {
								active: true,
							},
						},
					},
				},
			};
			expect( hasAnySecurityFeature( stateIn ) ).toBe( true );
		} );

		test( 'should return false when none of the security features are available', () => {
			const stateIn = {
				jetpack: {
					modules: {
						items: {},
					},
					pluginsData: {
						items: {
							'akismet/akismet.php': {
								active: false,
							},
						},
					},
				},
			};
			expect( hasAnySecurityFeature( stateIn ) ).toBe( false );
		} );
	} );
} );
