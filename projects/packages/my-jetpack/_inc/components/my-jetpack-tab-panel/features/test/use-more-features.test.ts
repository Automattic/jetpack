import { filterMoreFeatures, groupMoreFeatures } from '../use-more-features';
import type { MyJetpackModule } from '../../../../types';

const mod = ( slug: string, overrides: Partial< MyJetpackModule > = {} ): MyJetpackModule => ( {
	module: slug,
	name: slug.toUpperCase(),
	description: `${ slug } description`,
	long_description: '',
	search_terms: '',
	available: true,
	activated: false,
	...overrides,
} );

const modules = Object.fromEntries(
	[
		mod( 'sso', { activated: true } ),
		mod( 'monitor' ),
		mod( 'publicize' ),
		mod( 'stats' ),
		mod( 'zeta' ),
		mod( 'alpha' ),
		mod( 'waf', { available: false } ),
	].map( $module => [ $module.module, $module ] )
);

const features = [
	{ module: '', product: 'social' },
	{ module: 'stats', product: '' },
] as MainFeature[];

const groups = [
	{ label: 'Security', modules: [ 'monitor', 'sso', 'waf' ] },
	{ label: 'Earn', modules: [ 'wordads' ] },
];

describe( 'groupMoreFeatures', () => {
	const grouped = groupMoreFeatures( features, groups, modules, { social: 'publicize' } );

	it( 'keeps the listed order, drops empty groups and leaves out covered or unavailable modules', () => {
		expect(
			grouped.map( group => [ group.label, group.modules.map( $module => $module.module ) ] )
		).toEqual( [
			[ 'Security', [ 'monitor', 'sso' ] ],
			[ 'Other', [ 'alpha', 'zeta' ] ],
		] );
	} );

	it( 'filters by status and hides modules under plan filters', () => {
		const slugsFor = ( filter: Parameters< typeof filterMoreFeatures >[ 1 ] ) =>
			filterMoreFeatures( grouped, filter, '' ).flatMap( group =>
				group.modules.map( $module => $module.module )
			);

		expect( slugsFor( 'active' ) ).toEqual( [ 'sso' ] );
		expect( slugsFor( 'inactive' ) ).toEqual( [ 'monitor', 'alpha', 'zeta' ] );
		expect( slugsFor( 'security' ) ).toEqual( [] );
	} );

	it( 'searches regardless of the filter', () => {
		expect( filterMoreFeatures( grouped, 'active', 'monitor' ) ).toEqual( [
			{ label: 'Security', modules: [ modules.monitor ] },
		] );
	} );
} );
