import setModulesData from '../reducer';

describe( 'setModulesData Reducer', () => {
	const defaultState = {
		isLoading: false,
		isUpdating: {},
		data: {},
	};

	test( 'returns the default state for unknown action types', () => {
		const state = setModulesData( undefined, {} );
		expect( state ).toEqual( defaultState );
	} );

	test( 'sets the jetpack modules', () => {
		const action = {
			type: 'SET_JETPACK_MODULES',
			options: {
				isLoading: false,
				isUpdating: { 'test-module': false },
				data: { 'test-module': { activated: true } },
			},
		};
		const state = setModulesData( undefined, action );
		expect( state ).toEqual( {
			...defaultState,
			...action.options,
		} );
	} );

	test( 'sets the module updating status', () => {
		const action = {
			type: 'SET_MODULE_UPDATING',
			name: 'test-module',
			isUpdating: true,
		};
		const state = setModulesData( undefined, action );
		expect( state ).toEqual( {
			...defaultState,
			isUpdating: {
				...defaultState.isUpdating,
				[ action.name ]: action.isUpdating,
			},
		} );
	} );
} );
