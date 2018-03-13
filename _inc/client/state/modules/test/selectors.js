import { expect } from 'chai';

import {
	isFetchingModulesList,
	isActivatingModule,
	isDeactivatingModule,
	isUpdatingModuleOption,
	getModules,
	getModule,
	isModuleActivated,
	getModuleOverride
} from '../reducer';

let state = {
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
							currentValue: 2
						}
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
					'module-a': true
				},
				deactivating: {
					'module-b': true
				},
				updatingOption: {
					'module-c': {
						n_per_minute: true
					}
				}
			}
		}
	}
};

describe( 'requests selectors', () => {
	describe( '#isFetchingModulesList', () => {
		it( 'should return state.jetpack.modules.requests.fetchingModulesList', () => {
			const stateIn = state;
			const output = isFetchingModulesList( stateIn );
			expect( output ).to.be.true;
		} );
	} );

	describe( '#isActivatingModule', () => {
		it( 'should return state.jetpack.modules.requests.activating[ module_slug ]', () => {
			const stateIn = state;
			const output = isActivatingModule( stateIn, 'module-a' );
			expect( output ).to.be.true;
		} );
	} );

	describe( '#isDeactivatingModule', () => {
		it( 'should return state.jetpack.modules.requests.deactivating[ module_slug ]', () => {
			const stateIn = state;
			const output = isDeactivatingModule( stateIn, 'module-b' );
			expect( output ).to.be.true;
		} );
	} );

	describe( '#isUpdatingModuleOption', () => {
		it( 'should return state.jetpack.modules.requests.updatingOpton[ module_slug ][ option_name ]', () => {
			const stateIn = state;
			const output = isUpdatingModuleOption( stateIn, 'module-c', 'n_per_minute' );
			expect( output ).to.be.true;
		} );
	} );
} );

describe( 'items selectors', () => {
	describe( '#getModules', () => {
		it( 'should return state.jetpack.modules.items', () => {
			const stateIn = state;
			const output = getModules( stateIn );
			expect( output ).to.eql( stateIn.jetpack.modules.items );
		} );
	} );

	describe( '#getModule', () => {
		it( 'should return state.jetpack.modules.items[ module_slug ]', () => {
			const stateIn = state;
			const output = getModule( stateIn, 'module-a' );
			expect( output ).to.eql( stateIn.jetpack.modules.items[ 'module-a' ] );
		} );
	} );

	describe( '#isModuleActivated', () => {
		it( 'should return state.jetpack.modules.items[ module_slug ].activated', () => {
			const stateIn = state;
			const output = isModuleActivated( stateIn, 'module-a' );
			expect( output ).to.eql( stateIn.jetpack.modules.items[ 'module-a' ].activated );
		} );
	} );

	describe( '#getModuleOverride',  () => {
		it( 'should return active when module forced on', () => {
			expect( getModuleOverride( state, 'module-a' ) ).to.eql( 'active' );
		} );

		it( 'should return inactive when module forced off', () => {
			expect( getModuleOverride( state, 'module-b' ) ).to.eql( 'inactive' );
		} );

		it( 'should return false when module not overriden', () => {
			expect( getModuleOverride( state, 'module-c' ) ).to.be.false;
		} );
	} );
} );
