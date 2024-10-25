import apiFetch from '@wordpress/api-fetch';
import { combineReducers, createReduxStore, dispatch, register, select } from '@wordpress/data';
import { createWpDataSync } from '../src/create-wp-data-sync';

jest.mock( '@wordpress/api-fetch' );

const registerStore = () => {
	const { reducers, ...config } = createWpDataSync( 'testSettings', {
		endpoint: '/test',
	} );

	const store = createReduxStore( 'some-store-id', {
		reducer: combineReducers( {
			testSettings: ( state, action ) => {
				if ( action.type === 'RESET' ) {
					return {};
				}
				return reducers.testSettings( state, action );
			},
		} ),
		...config,
		actions: {
			...config.actions,
			reset: () => ( { type: 'RESET' } ),
		},
	} );

	register( store );

	return store;
};

const store = registerStore();

beforeEach( async () => {
	dispatch( store ).reset();
} );

afterAll( () => {
	jest.restoreAllMocks();
} );

describe( 'selectors', () => {
	describe( 'getTestSettings', () => {
		it( 'should return the data', () => {
			dispatch( store ).setTestSettings( { key: 'test' } );

			expect( select( store ).getTestSettings() ).toEqual( { key: 'test' } );
		} );

		it( 'should return undefined', () => {
			expect( select( store ).getTestSettings() ).toBeUndefined();
		} );
	} );

	describe( 'getTestSettingsStatus', () => {
		it( 'should return undefined', () => {
			expect( select( store ).getTestSettingsStatus() ).toBeUndefined();
		} );

		it( 'should return the status', () => {
			dispatch( store ).setStatusForTestSettings( 'fetching' );

			expect( select( store ).getTestSettingsStatus() ).toBe( 'fetching' );
		} );
	} );

	describe( 'getTestSettingsLastError', () => {
		it( 'should return undefined', () => {
			expect( select( store ).getTestSettingsLastError() ).toBeUndefined();
		} );

		it( 'should return the last error', () => {
			dispatch( store ).setErrorForTestSettings( 'Some error' );

			expect( select( store ).getTestSettingsLastError() ).toBe( 'Some error' );
		} );
	} );
} );

describe( 'actions', () => {
	describe( 'setTestSettings', () => {
		it( 'should set the data', () => {
			dispatch( store ).setTestSettings( { key: 'test' } );

			expect( select( store ).getTestSettings() ).toEqual( { key: 'test' } );
		} );

		it( 'should merge the new data', () => {
			dispatch( store ).setTestSettings( { key1: 'test' } );

			expect( select( store ).getTestSettings() ).toEqual( { key1: 'test' } );

			dispatch( store ).setTestSettings( { key2: 'test' } );

			expect( select( store ).getTestSettings() ).toEqual( { key1: 'test', key2: 'test' } );
		} );
	} );

	describe( 'setErrorForTestSettings', () => {
		it( 'should set the error', () => {
			dispatch( store ).setErrorForTestSettings( 'Some error' );

			expect( select( store ).getTestSettingsLastError() ).toBe( 'Some error' );

			dispatch( store ).setErrorForTestSettings( 'Another error' );

			expect( select( store ).getTestSettingsLastError() ).toBe( 'Another error' );
		} );
	} );

	describe( 'setStatusForTestSettings', () => {
		it( 'should set the status', () => {
			dispatch( store ).setStatusForTestSettings( 'fetching' );

			expect( select( store ).getTestSettingsStatus() ).toBe( 'fetching' );

			dispatch( store ).setStatusForTestSettings( 'updating' );

			expect( select( store ).getTestSettingsStatus() ).toBe( 'updating' );
		} );
	} );

	describe( 'fetchTestSettings', () => {
		it( 'should set the status to fetching', async () => {
			dispatch( store ).fetchTestSettings();

			expect( select( store ).getTestSettingsStatus() ).toBe( 'fetching' );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/test',
			} );
		} );
	} );

	describe( 'updateTestSettings', () => {
		it( 'should update the data', () => {
			dispatch( store ).setTestSettings( { key1: 'test1' } );

			dispatch( store ).updateTestSettings( { key2: 'test2' } );

			// The data should be updated optimistically
			expect( select( store ).getTestSettings() ).toEqual( { key1: 'test1', key2: 'test2' } );

			expect( apiFetch ).toHaveBeenCalledWith( {
				path: '/test',
				method: 'POST',
				data: {
					key2: 'test2',
				},
			} );
		} );
	} );
} );
