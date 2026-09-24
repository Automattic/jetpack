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
		// Deprecated: left out by the hidden set, as the hook passes it.
		mod( 'google-fonts' ),
	].map( $module => [ $module.module, $module ] )
);

const features = [
	{ module: '', product: 'social' },
	{ module: 'stats', product: '' },
] as MainFeature[];

const groups = [
	// Listed out of order: the group sorts by name, not by this list.
	{ label: 'Security', modules: [ 'sso', 'waf', 'monitor' ] },
	{ label: 'Design', modules: [ 'google-fonts' ] },
	{ label: 'Analytics', modules: [ 'zeta' ] },
	{ label: 'Earn', modules: [ 'wordads' ] },
];

const slugsOf = ( grouped: ReturnType< typeof groupMoreFeatures > ) =>
	grouped.map( group => [ group.label, group.states.map( state => state.feature.slug ) ] );

describe( 'groupMoreFeatures', () => {
	const grouped = groupMoreFeatures(
		features,
		groups,
		modules,
		{ social: 'publicize' },
		{},
		new Set( [ 'google-fonts' ] )
	);

	it( 'sorts groups and their modules by name with Other last, drops empty groups and leaves out covered, unavailable and hidden modules', () => {
		expect( slugsOf( grouped ) ).toEqual( [
			[ 'Analytics', [ 'zeta' ] ],
			[ 'Security', [ 'monitor', 'sso' ] ],
			[ 'Other', [ 'alpha' ] ],
		] );
	} );

	it( 'leaves out a product\u2019s module even while a pre-release gate hides its card', () => {
		// The AI card resolves no module while the gate is on; the module must not turn up
		// under Other instead, offering the switch the gate withheld.
		const withAi = { ...modules, ai: mod( 'ai' ) };
		const aiFeature = [ { module: '', product: 'jetpack-ai' } ] as MainFeature[];

		const withAiFeature = groupMoreFeatures(
			aiFeature,
			groups,
			withAi,
			{ 'jetpack-ai': 'ai' },
			{}
		);

		expect(
			withAiFeature.flatMap( group => group.states.map( state => state.feature.slug ) )
		).not.toContain( 'ai' );
	} );

	it( 'keeps a grouped module that a plugin-delivered feature shares a slug with', () => {
		const withProtect = { ...modules, protect: mod( 'protect' ) };
		const protectGroups = [ { label: 'Security', modules: [ 'protect' ] } ];
		const slugs = ( inJetpack: boolean ) =>
			slugsOf(
				groupMoreFeatures(
					[ { module: '', product: 'protect', in_jetpack: inJetpack } ] as MainFeature[],
					protectGroups,
					withProtect,
					{},
					{}
				)
			)[ 0 ];

		expect( slugs( false ) ).toEqual( [ 'Security', [ 'protect' ] ] );
		// Where Jetpack's module is the card's own switch, the card already covers it.
		expect( slugs( true ) ).not.toEqual( [ 'Security', [ 'protect' ] ] );
	} );

	it( 'shows the value a switch asked for while its request is out', () => {
		const asked = groupMoreFeatures( features, groups, modules, {}, { 'module:monitor': true } );
		const monitor = asked.find( group => group.label === 'Security' )!.states[ 0 ];

		expect( monitor.status ).toBe( 'active' );
		expect( monitor.isSwitching ).toBe( true );
	} );

	it( 'filters by status and hides modules under plan and essential filters', () => {
		const filtered = ( filter: Parameters< typeof filterMoreFeatures >[ 1 ] ) =>
			filterMoreFeatures( grouped, filter, '' ).flatMap( group =>
				group.states.map( state => state.feature.slug )
			);

		expect( filtered( 'active' ) ).toEqual( [ 'sso' ] );
		expect( filtered( 'inactive' ) ).toEqual( [ 'zeta', 'monitor', 'alpha' ] );
		expect( filtered( 'security' ) ).toEqual( [] );
		expect( filtered( 'essential' ) ).toEqual( [] );
	} );

	it( 'keeps a module whose switch is still in flight, whatever the filter says', () => {
		const asked = groupMoreFeatures( features, groups, modules, {}, { 'module:monitor': true } );

		// The click moved it to Active, but it must not leave the Inactive list mid-request.
		expect(
			filterMoreFeatures( asked, 'inactive', '' ).flatMap( group =>
				group.states.map( state => state.feature.slug )
			)
		).toContain( 'monitor' );
	} );

	it( 'searches regardless of the filter', () => {
		const found = filterMoreFeatures( grouped, 'active', 'monitor' );

		expect( slugsOf( found ) ).toEqual( [ [ 'Security', [ 'monitor' ] ] ] );
	} );
} );

describe( 'getHiddenModules', () => {
	const design = {
		'google-fonts': mod( 'google-fonts' ),
		widgets: mod( 'widgets', { activated: true } ),
		'widget-visibility': mod( 'widget-visibility' ),
	};
	// A fresh copy per case: the page-load snapshot is module-scoped.
	const hiddenOnLoad = async (
		isBlockTheme: boolean,
		...loads: Record< string, MyJetpackModule >[]
	) => {
		window.JetpackScriptData = {
			myJetpack: { siteEditor: { isBlockTheme } },
		} as Window[ 'JetpackScriptData' ];
		let hidden: Set< string > = new Set();
		await jest.isolateModulesAsync( async () => {
			const { getHiddenModules } = await import( '../use-more-features' );
			loads.forEach( load => ( hidden = getHiddenModules( load ) ) );
		} );
		return [ ...hidden ];
	};

	it( 'hides Google Fonts and, on a block theme, the widget modules, unless one is on', async () => {
		await expect( hiddenOnLoad( true, design ) ).resolves.toEqual( [
			'google-fonts',
			'widget-visibility',
		] );
	} );

	it( 'keeps the widget modules on a classic theme', async () => {
		await expect( hiddenOnLoad( false, design ) ).resolves.toEqual( [ 'google-fonts' ] );
	} );

	it( 'keeps a module switched off since the page loaded', async () => {
		const off = { ...design, widgets: mod( 'widgets' ) };

		await expect( hiddenOnLoad( true, design, off ) ).resolves.toEqual( [
			'google-fonts',
			'widget-visibility',
		] );
	} );

	it( 'drops the Design group once nothing in it is left', () => {
		const grouped = groupMoreFeatures(
			[],
			[ { label: 'Design', modules: [ 'google-fonts', 'widget-visibility' ] } ],
			design,
			{},
			{},
			new Set( [ 'google-fonts', 'widget-visibility' ] )
		);

		expect( grouped.map( group => group.label ) ).not.toContain( 'Design' );
		// Hidden, not moved: they must not resurface under Other.
		expect( slugsOf( grouped ).flatMap( ( [ , slugs ] ) => slugs ) ).toEqual( [ 'widgets' ] );
	} );
} );
