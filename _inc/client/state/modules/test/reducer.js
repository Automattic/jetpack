import { expect } from 'chai';

import {
	items as itemsReducer,
	requests as requestsReducer,
	initialRequestsState,
	getModuleOptionValidValues
} from '../reducer';

describe( 'items reducer', () => {
	it( 'state should default to empty object', () => {
		const state = itemsReducer( undefined, {} );
		expect( state ).to.eql( {} );
	} );

	let modules = {
		'module-a': {
			module: 'module-a',
			activated: false
		},
		'module-b': {
			module: 'module-b',
			activated: true,
			options: {
				c: {
					currentValue: 2
				}
			}
		},
		'module-c': {
			module: 'module-c',
			activated: true,
			options: {
				color: {
					currentValue: 'black',
					enum: [ 'black', 'red', 'fuchsia' ],
					enum_labels: {
						black: 'Make it black.',
						red: 'Make it red.',
						fuchsia: 'Make it fuchsia, whatever that is.'
					}
				}
			}
		},
	};

	describe( 'upon module list receive', () => {
		let stateOut, action;

		before( () => {
			const stateIn = {}
			action = {
				type: 'JETPACK_MODULES_LIST_RECEIVE',
				modules: modules
			};
			stateOut = itemsReducer( stateIn, action );
		} );

		describe( '#modulesFetch', () => {
			it( 'should replace .items with the modules list', () => {
				expect( Object.keys( stateOut ).length ).to.equal( Object.keys( action.modules ).length );
			} );
		} );

		describe( '#getModuleOptionValidValues', () => {
			it( 'should report valid values from the result data', () => {
				let state = { jetpack: { modules: { items: stateOut } } };
				expect( getModuleOptionValidValues( state, 'module-c', 'color' ) )
					.to.equal( modules['module-c'].options.color.enum_labels );
			} );
		} );
	} );

	describe( '#modulesActivation', () => {
		it( 'should activate a module', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULE_ACTIVATE_SUCCESS',
				module: 'module-a'
			};
			let stateOut = itemsReducer( stateIn, action );
			expect( stateOut[ 'module-a' ].activated ).to.be.true;
		} );

		it( 'should deactivate a module', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULE_DEACTIVATE_SUCCESS',
				module: 'module-b'
			};
			let stateOut = itemsReducer( stateIn, action );
			expect( stateOut[ 'module-b' ].activated ).to.be.false;
		} );
	} );

	describe( '#modulesOptionsUpdate', () => {
		it( 'should update a module\'s option', () => {
			const stateIn = modules;
			const action = {
				type: 'JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS',
				module: 'module-b',
				newOptionValues: {
					c: 30
				}
			};
			let stateOut = itemsReducer( stateIn, action );
			Object.keys( action.newOptionValues ).forEach( key => {
				expect( stateOut[ action.module ].options[ key ].current_value ).to.equal( action.newOptionValues[ key ] );
			} );
		} );
	} );

	describe( '#initialState', () => {
		it( 'should replace .items with the initial state\'s modules list', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_SET_INITIAL_STATE',
				initialState: {
					getModules: modules
				}
			};
			let stateOut = itemsReducer( stateIn, action );
			expect( stateOut ).to.eql( action.initialState.getModules );
		} );
	} );
} );

describe( 'requests reducer', () => {
	it( 'state should default to initialState', () => {
		const state = requestsReducer( undefined, {} );
		expect( state ).to.equal( initialRequestsState );
	} );

	describe( '#modulesFetch', () => {
		it( 'should set fetchingModulesList to true when fetching', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULES_LIST_FETCH'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingModulesList ).to.be.true;
		} );

		it( 'should set fetchingModulesList to false when receeiving module list', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULES_LIST_RECEIVE'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingModulesList ).to.be.false;
		} );

		it( 'should set fetchingModulesList to false when fetching fails', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULES_LIST_FETCH_FAIL'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingModulesList ).to.be.false;
		} );
	} );

	describe( '#modulesActivation', () => {
		it( 'should set activating[ module_slug ] to true when activating a module', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULE_ACTIVATE',
				module: 'module_slug'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.activating[ action.module ] ).to.be.true;
		} );

		it( 'should set activating[ module_slug ] to false when module has been activated', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULE_ACTIVATE_SUCCESS',
				module: 'module_slug'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.activating[ action.module ] ).to.be.false;
		} );

		it( 'should set activating[ module_slug ] to false when activating a module fails', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULE_ACTIVATE_FAIL',
				module: 'module_slug'
			};
			let stateOut = requestsReducer( stateIn, action );
			expect( stateOut.activating[ action.module ] ).to.be.false;
		} );
	} );

	describe( '#moduleOptionsUpdate', () => {
		it( 'should set updatingOption[ module_slug ][ option_name ] to true when updating a module\'s option', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULE_UPDATE_OPTIONS',
				module: 'module_slug',
				newOptionValues: {
					option_name: 'option_name'
				}
			};
			let stateOut = requestsReducer( stateIn, action );
			Object.keys( action.newOptionValues ).forEach( key => {
				expect( stateOut.updatingOption[ action.module ][ key] ).to.be.true;
			} );
		} );

		it( 'should set updatingOption[ module_slug ][ option_name ] to false when a module\'s option has been updated', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS',
				module: 'module_slug',
				newOptionValues: {
					option_name: 'option_value'
				}
			};
			let stateOut = requestsReducer( stateIn, action );
			Object.keys( action.newOptionValues ).forEach( key => {
				expect( stateOut.updatingOption[ action.module ][ key ] ).to.be.false;
			} );
		} );

		it( 'should set updatingOption[ module_slug ][ option_name ] to false when updating a module\'s option fails', () => {
			const stateIn = {}
			const action = {
				type: 'JETPACK_MODULE_UPDATE_OPTIONS_FAIL',
				module: 'module_slug',
				newOptionValues: {
					option_name: 'option_name'
				}
			};
			let stateOut = requestsReducer( stateIn, action );
			Object.keys( action.newOptionValues ).forEach( key => {
				expect( stateOut.updatingOption[ action.module ][ key ] ).to.be.false;
			} );
		} );
	} );
} );
