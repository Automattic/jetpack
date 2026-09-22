import { filterMoreFeatures, groupMoreFeatures } from '../use-more-features';
import type { MyJetpackModule } from '../../../../types';

const mod = ( slug: string, overrides: Partial< MyJetpackModule > = {} ): MyJetpackModule =>
	( {
		module: slug,
		name: slug.toUpperCase(),
		description: `${ slug } description`,
		long_description: '',
		search_terms: '',
		available: true,
		activated: false,
		...overrides,
	} ) as MyJetpackModule;

const modules = Object.fromEntries(
	[
		mod( 'sso', { activated: true } ),
		mod( 'monitor' ),
		mod( 'publicize' ),
		mod( 'stats' ),
		mod( 'zeta' ),
		mod( 'alpha' ),
		mod( 'waf', { available: false } ),
		// Legacy: the Products tab hides it while it is off, and so does this.
		mod( 'google-fonts' ),
	].map( $module => [ $module.module, $module ] )
);

const features = [
	{ module: '', product: 'social' },
	{ module: 'stats', product: '' },
] as MainFeature[];

const groups = [
	{ label: 'Security', modules: [ 'monitor', 'sso', 'waf' ] },
	{ label: 'Design', modules: [ 'google-fonts' ] },
	{ label: 'Earn', modules: [ 'wordads' ] },
];

const slugsOf = ( grouped: ReturnType< typeof groupMoreFeatures > ) =>
	grouped.map( group => [ group.label, group.states.map( state => state.feature.slug ) ] );

describe( 'groupMoreFeatures', () => {
	const grouped = groupMoreFeatures( features, groups, modules, { social: 'publicize' }, {} );

	it( 'keeps the listed order, drops empty groups and leaves out covered, unavailable and legacy modules', () => {
		expect( slugsOf( grouped ) ).toEqual( [
			[ 'Security', [ 'monitor', 'sso' ] ],
			[ 'Other', [ 'alpha', 'zeta' ] ],
		] );
	} );

	it( 'shows the value a switch asked for while its request is out', () => {
		const asked = groupMoreFeatures( features, groups, modules, {}, { 'module:monitor': true } );
		const monitor = asked[ 0 ].states[ 0 ];

		expect( monitor.status ).toBe( 'active' );
		expect( monitor.isSwitching ).toBe( true );
	} );

	it( 'filters by status and hides modules under plan and essential filters', () => {
		const filtered = ( filter: Parameters< typeof filterMoreFeatures >[ 1 ] ) =>
			filterMoreFeatures( grouped, filter, '' ).flatMap( group =>
				group.states.map( state => state.feature.slug )
			);

		expect( filtered( 'active' ) ).toEqual( [ 'sso' ] );
		expect( filtered( 'inactive' ) ).toEqual( [ 'monitor', 'alpha', 'zeta' ] );
		expect( filtered( 'security' ) ).toEqual( [] );
		expect( filtered( 'essential' ) ).toEqual( [] );
	} );

	it( 'searches regardless of the filter', () => {
		const found = filterMoreFeatures( grouped, 'active', 'monitor' );

		expect( slugsOf( found ) ).toEqual( [ [ 'Security', [ 'monitor' ] ] ] );
	} );
} );
