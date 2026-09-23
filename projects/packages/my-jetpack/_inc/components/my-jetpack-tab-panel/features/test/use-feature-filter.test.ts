import { getFeatureFilters, isFeatureFilter, matchesFilter } from '../use-feature-filter';
import type { FeatureState } from '../feature-state';

const buildState = ( feature: Partial< MainFeature >, status = 'inactive' ): FeatureState =>
	( {
		feature: { slug: 'feature', name: 'Feature', essential: false, plans: [], ...feature },
		status,
		control: { kind: 'none' },
	} ) as FeatureState;

const security = { slug: 'security', name: 'Security' };

describe( 'matchesFilter', () => {
	it( 'keeps every feature under All', () => {
		expect( matchesFilter( buildState( {} ), 'all' ) ).toBe( true );
	} );

	it( 'splits Active and Inactive on the live status, not the catalog', () => {
		const on = buildState( {}, 'active' );
		const off = buildState( {} );

		expect( [ matchesFilter( on, 'active' ), matchesFilter( on, 'inactive' ) ] ).toEqual( [
			true,
			false,
		] );
		expect( [ matchesFilter( off, 'active' ), matchesFilter( off, 'inactive' ) ] ).toEqual( [
			false,
			true,
		] );
	} );

	it( 'matches a plan filter on plan membership', () => {
		const state = buildState( { plans: [ security ] } );

		expect( matchesFilter( state, 'security' ) ).toBe( true );
		expect( matchesFilter( state, 'growth' ) ).toBe( false );
	} );

	it( 'matches Essential on the feature, not on a plan', () => {
		expect( matchesFilter( buildState( { essential: true } ), 'essential' ) ).toBe( true );
		expect( matchesFilter( buildState( { plans: [ security ] } ), 'essential' ) ).toBe( false );
	} );
} );

describe( 'getFeatureFilters', () => {
	it( 'offers every pill as a filter the URL can carry', () => {
		expect( getFeatureFilters().every( ( { value } ) => isFeatureFilter( value ) ) ).toBe( true );
	} );

	it( 'keeps Complete selectable without giving it a pill', () => {
		expect( isFeatureFilter( 'complete' ) ).toBe( true );
		expect( getFeatureFilters().map( ( { value } ) => value ) ).not.toContain( 'complete' );
	} );

	it( 'rejects a filter the grid does not know', () => {
		expect( isFeatureFilter( 'bundle' ) ).toBe( false );
	} );
} );
