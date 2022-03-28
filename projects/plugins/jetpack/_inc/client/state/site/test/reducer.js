import { expect } from 'chai';

import {
	isDoneFetchingConnectedPlugins,
	getConnectedPlugins,
	getConnectedPluginsMap,
} from '../reducer';

describe( 'site selectors', () => {
	const connectedPlugins = [
		{ slug: 'slug1', name: 'name1' },
		{ slug: 'slug2', name: 'name2' },
	];
	const baseInState = {
		jetpack: {
			siteData: {
				requests: {
					isDoneFetchingConnectedPlugins: true,
				},
				data: {
					site: {
						connectedPlugins,
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
		it( 'should return true when set true', () => {
			const result = isDoneFetchingConnectedPlugins( inState );

			expect( result ).to.be.true;
		} );

		it( 'should return false when set to false', () => {
			inState.jetpack.siteData.requests.isDoneFetchingConnectedPlugins = false;

			const result = isDoneFetchingConnectedPlugins( inState );

			expect( result ).to.be.false;
		} );

		it( 'should return false when not set', () => {
			delete inState.jetpack.siteData.requests.isDoneFetchingConnectedPlugins;

			const result = isDoneFetchingConnectedPlugins( inState );

			expect( result ).to.be.false;
		} );
	} );

	describe( '#getConnectedPlugins', () => {
		it( 'should return null if still fetching connected plugins', () => {
			inState.jetpack.siteData.requests.isDoneFetchingConnectedPlugins = false;

			const result = getConnectedPlugins( inState );

			expect( result ).to.be.null;
		} );

		it( 'should return connected plugins if finished fetching', () => {
			const result = getConnectedPlugins( inState );

			expect( result ).to.eql( connectedPlugins );
		} );
	} );

	describe( '#getConnectedPluginsMap', () => {
		it( 'should return null if still fetching connected plugins', () => {
			inState.jetpack.siteData.requests.isDoneFetchingConnectedPlugins = false;

			const result = getConnectedPluginsMap( inState );

			expect( result ).to.be.null;
		} );

		it( 'should return slug keyed object map of connected plugins when available', () => {
			const expectedMap = {
				slug1: { name: 'name1' },
				slug2: { name: 'name2' },
			};

			const result = getConnectedPluginsMap( inState );

			expect( result ).to.eql( expectedMap );
		} );
	} );
} );
