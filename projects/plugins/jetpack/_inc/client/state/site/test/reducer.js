import {
	siteHasFeature,
	isDoneFetchingConnectedPlugins,
	getConnectedPlugins,
	getConnectedPluginsMap,
} from '../reducer';

describe( 'site selectors', () => {
	const connectedPlugins = [
		{ slug: 'slug1', name: 'name1' },
		{ slug: 'slug2', name: 'name2' },
	];
	const active = [ 'feature_active_01', 'feature_active_02', 'feature_active_03' ];
	const baseInState = {
		jetpack: {
			siteData: {
				requests: {
					isDoneFetchingConnectedPlugins: true,
				},
				data: {
					site: {
						connectedPlugins,
						features: {
							active,
						},
					},
				},
			},
		},
	};
	let inState;

	beforeEach( () => {
		inState = JSON.parse( JSON.stringify( baseInState ) );
	} );

	describe( '#isDoneFetchingConnectedPlugins', () => {
		test( 'should return true when set true', () => {
			const result = isDoneFetchingConnectedPlugins( inState );

			expect( result ).toBe( true );
		} );

		test( 'should return false when set to false', () => {
			inState.jetpack.siteData.requests.isDoneFetchingConnectedPlugins = false;

			const result = isDoneFetchingConnectedPlugins( inState );

			expect( result ).toBe( false );
		} );

		test( 'should return false when not set', () => {
			delete inState.jetpack.siteData.requests.isDoneFetchingConnectedPlugins;

			const result = isDoneFetchingConnectedPlugins( inState );

			expect( result ).toBe( false );
		} );
	} );

	describe( '#getConnectedPlugins', () => {
		test( 'should return null if still fetching connected plugins', () => {
			inState.jetpack.siteData.requests.isDoneFetchingConnectedPlugins = false;

			const result = getConnectedPlugins( inState );

			expect( result ).toBeNull();
		} );

		test( 'should return connected plugins if finished fetching', () => {
			const result = getConnectedPlugins( inState );

			expect( result ).toEqual( connectedPlugins );
		} );
	} );

	describe( '#getConnectedPluginsMap', () => {
		test( 'should return null if still fetching connected plugins', () => {
			inState.jetpack.siteData.requests.isDoneFetchingConnectedPlugins = false;

			const result = getConnectedPluginsMap( inState );

			expect( result ).toBeNull();
		} );

		test( 'should return slug keyed object map of connected plugins when available', () => {
			const expectedMap = {
				slug1: { name: 'name1' },
				slug2: { name: 'name2' },
			};

			const result = getConnectedPluginsMap( inState );

			expect( result ).toEqual( expectedMap );
		} );
	} );

	describe( '#siteHasFeature()', () => {
		test( 'should return False when feature param is not defined', () => {
			const activeFeature = siteHasFeature( inState );
			expect( activeFeature ).toBe( false );
		} );

		test( 'should return False when feature is not defined in the active array', () => {
			const activeFeature = siteHasFeature( inState, 'unknown-feature' );
			expect( activeFeature ).toBe( false );
		} );

		test( 'should return True when feature is defined in the active array', () => {
			const activeFeature = siteHasFeature( inState, 'feature_active_01' );
			expect( activeFeature ).toBe( true );
		} );
	} );
} );
