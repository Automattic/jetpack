import {
	items as itemsReducer,
	requests as requestsReducer,
	initialRequestsState,
	getModuleOptionValidValues,
} from '../reducer';

describe( 'items reducer', () => {
	test( 'state should default to empty object', () => {
		const state = itemsReducer( undefined, {} );
		expect( state ).toEqual( {} );
	} );

	const modules = {
		'module-a': {
			module: 'module-a',
			activated: false,
		},
		'module-b': {
			module: 'module-b',
			activated: true,
			options: {
				c: {
					currentValue: 2,
				},
			},
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
						fuchsia: 'Make it fuchsia, whatever that is.',
					},
				},
			},
		},
	};

	describe( 'upon module list receive', () => {
		let stateOut, action;

		beforeAll( () => {
			const stateIn = {};
			action = {
				type: 'JETPACK_MODULES_LIST_RECEIVE',
				modules: modules,
			};
			stateOut = itemsReducer( stateIn, action );
		} );

		describe( '#modulesFetch', () => {
			test( 'should replace .items with the modules list', () => {
				expect( Object.keys( stateOut ) ).toHaveLength( Object.keys( action.modules ).length );
			} );
		} );

		describe( '#getModuleOptionValidValues', () => {
			test( 'should report valid values from the result data', () => {
				const state = { jetpack: { modules: { items: stateOut } } };
				expect( getModuleOptionValidValues( state, 'module-c', 'color' ) ).toEqual(
					modules[ 'module-c' ].options.color.enum_labels
				);
			} );
		} );
	} );

	describe( '#modulesActivation', () => {
		test( 'should activate a module', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULE_ACTIVATE_SUCCESS',
				module: 'module-a',
			};
			const stateOut = itemsReducer( stateIn, action );
			expect( stateOut[ 'module-a' ].activated ).toBe( true );
		} );

		test( 'should deactivate a module', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULE_DEACTIVATE_SUCCESS',
				module: 'module-b',
			};
			const stateOut = itemsReducer( stateIn, action );
			expect( stateOut[ 'module-b' ].activated ).toBe( false );
		} );
	} );

	describe( '#modulesOptionsUpdate', () => {
		test( "should update a module's option", () => {
			const stateIn = modules;
			const action = {
				type: 'JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS',
				module: 'module-b',
				newOptionValues: {
					c: 30,
				},
			};
			const stateOut = itemsReducer( stateIn, action );
			Object.keys( action.newOptionValues ).forEach( key => {
				expect( stateOut[ action.module ].options[ key ].current_value ).toEqual(
					action.newOptionValues[ key ]
				);
			} );
		} );
	} );

	describe( '#initialState', () => {
		test( "should replace .items with the initial state's modules list", () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_SET_INITIAL_STATE',
				initialState: {
					getModules: modules,
				},
			};
			const stateOut = itemsReducer( stateIn, action );
			expect( stateOut ).toEqual( action.initialState.getModules );
		} );
	} );
} );

describe( 'requests reducer', () => {
	test( 'state should default to initialState', () => {
		const state = requestsReducer( undefined, {} );
		expect( state ).toEqual( initialRequestsState );
	} );

	describe( '#modulesFetch', () => {
		test( 'should set fetchingModulesList to true when fetching', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULES_LIST_FETCH',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingModulesList ).toBe( true );
		} );

		test( 'should set fetchingModulesList to false when receeiving module list', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULES_LIST_RECEIVE',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingModulesList ).toBe( false );
		} );

		test( 'should set fetchingModulesList to false when fetching fails', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULES_LIST_FETCH_FAIL',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.fetchingModulesList ).toBe( false );
		} );
	} );

	describe( '#modulesActivation', () => {
		test( 'should set activating[ module_slug ] to true when activating a module', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULE_ACTIVATE',
				module: 'module_slug',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.activating[ action.module ] ).toBe( true );
		} );

		test( 'should set activating[ module_slug ] to false when module has been activated', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULE_ACTIVATE_SUCCESS',
				module: 'module_slug',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.activating[ action.module ] ).toBe( false );
		} );

		test( 'should set activating[ module_slug ] to false when activating a module fails', () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULE_ACTIVATE_FAIL',
				module: 'module_slug',
			};
			const stateOut = requestsReducer( stateIn, action );
			expect( stateOut.activating[ action.module ] ).toBe( false );
		} );
	} );

	describe( '#moduleOptionsUpdate', () => {
		test( "should set updatingOption[ module_slug ][ option_name ] to true when updating a module's option", () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULE_UPDATE_OPTIONS',
				module: 'module_slug',
				newOptionValues: {
					option_name: 'option_name',
				},
			};
			const stateOut = requestsReducer( stateIn, action );
			Object.keys( action.newOptionValues ).forEach( key => {
				expect( stateOut.updatingOption[ action.module ][ key ] ).toBe( true );
			} );
		} );

		test( "should set updatingOption[ module_slug ][ option_name ] to false when a module's option has been updated", () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULE_UPDATE_OPTIONS_SUCCESS',
				module: 'module_slug',
				newOptionValues: {
					option_name: 'option_value',
				},
			};
			const stateOut = requestsReducer( stateIn, action );
			Object.keys( action.newOptionValues ).forEach( key => {
				expect( stateOut.updatingOption[ action.module ][ key ] ).toBe( false );
			} );
		} );

		test( "should set updatingOption[ module_slug ][ option_name ] to false when updating a module's option fails", () => {
			const stateIn = {};
			const action = {
				type: 'JETPACK_MODULE_UPDATE_OPTIONS_FAIL',
				module: 'module_slug',
				newOptionValues: {
					option_name: 'option_name',
				},
			};
			const stateOut = requestsReducer( stateIn, action );
			Object.keys( action.newOptionValues ).forEach( key => {
				expect( stateOut.updatingOption[ action.module ][ key ] ).toBe( false );
			} );
		} );
	} );
} );
