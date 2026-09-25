import {
	JETPACK_PLUGINS_DATA_FETCH,
	JETPACK_PLUGINS_DATA_FETCH_RECEIVE,
	JETPACK_PLUGINS_DATA_FETCH_FAIL,
} from 'state/action-types';
import { reducer, hasFetchedPluginsData, isFetchingPluginsData } from '../reducer';

const stateFrom = pluginsData => ( { jetpack: { pluginsData } } );

describe( 'plugins reducer', () => {
	describe( '#hasFetchedPluginsData', () => {
		test( 'is false before anything has been requested', () => {
			const pluginsData = reducer( undefined, { type: '@@INIT' } );

			expect( hasFetchedPluginsData( stateFrom( pluginsData ) ) ).toBe( false );
		} );

		test( 'stays false while the request is in flight', () => {
			const pluginsData = reducer( undefined, { type: JETPACK_PLUGINS_DATA_FETCH } );

			expect( isFetchingPluginsData( stateFrom( pluginsData ) ) ).toBe( true );
			expect( hasFetchedPluginsData( stateFrom( pluginsData ) ) ).toBe( false );
		} );

		test( 'becomes true once the data arrives', () => {
			const pluginsData = reducer( undefined, {
				type: JETPACK_PLUGINS_DATA_FETCH_RECEIVE,
				pluginsData: {},
			} );

			expect( hasFetchedPluginsData( stateFrom( pluginsData ) ) ).toBe( true );
		} );

		test( 'becomes true when the request fails, so callers stop waiting', () => {
			const pluginsData = reducer( undefined, { type: JETPACK_PLUGINS_DATA_FETCH_FAIL } );

			expect( isFetchingPluginsData( stateFrom( pluginsData ) ) ).toBe( false );
			expect( hasFetchedPluginsData( stateFrom( pluginsData ) ) ).toBe( true );
		} );
	} );
} );
