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

	it( 'matches Included in plan on what the site already pays for', () => {
		expect( matchesFilter( buildState( { included: true } ), 'included' ) ).toBe( true );
		expect( matchesFilter( buildState( { plans: [ security ] } ), 'included' ) ).toBe( false );
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

	it( 'no longer knows Complete, which only the old plan badge could select', () => {
		expect( isFeatureFilter( 'complete' ) ).toBe( false );
		expect( getFeatureFilters().map( ( { value } ) => value ) ).not.toContain( 'complete' );
	} );

	it( 'swaps the category pills for Included in plan only on a visit that arrived on it', () => {
		const values = ( ...args: Parameters< typeof getFeatureFilters > ) =>
			getFeatureFilters( ...args ).map( ( { value } ) => value );

		expect( values( 'all' ) ).toEqual( [
			'all',
			'active',
			'inactive',
			'essential',
			'security',
			'growth',
		] );
		expect( values( 'all', true ) ).toEqual( [ 'all', 'active', 'inactive', 'included' ] );
	} );

	it( 'still gives Included in plan a pill when a link selects it mid-visit', () => {
		expect( getFeatureFilters( 'included' ).map( ( { value } ) => value ) ).toEqual( [
			'all',
			'active',
			'inactive',
			'included',
			'essential',
			'security',
			'growth',
		] );
	} );

	it( 'rejects a filter the grid does not know', () => {
		expect( isFeatureFilter( 'bundle' ) ).toBe( false );
	} );
} );
