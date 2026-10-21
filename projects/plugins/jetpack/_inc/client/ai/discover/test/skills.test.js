import { CATEGORY_ICONS } from '../category-icons';
import {
	APPLIES_LABELS,
	CATEGORY_LABELS,
	FIRST_SKILL_SLUG,
	SECTION_TITLES,
	buildPrompt,
	getCatalog,
	getSkill,
} from '../skills';

describe( 'Discover skills', () => {
	const all = [ ...getCatalog( true ), ...getCatalog( false ) ];
	const unique = [ ...new Map( all.map( skill => [ skill.slug, skill ] ) ).values() ];

	test( 'self-hosted sites get the shared skills plus the Jetpack-only one', () => {
		const catalog = getCatalog( true );

		expect( catalog ).toHaveLength( 15 );
		expect( catalog.every( skill => skill.applies !== 'wpcom' ) ).toBe( true );
		expect( catalog.map( skill => skill.slug ) ).toContain( 'fix-a-broken-jetpack-connection' );
	} );

	test( 'WordPress.com sites get the shared skills plus the WordPress.com-only ones', () => {
		const catalog = getCatalog( false );

		expect( catalog ).toHaveLength( 17 );
		expect( catalog.every( skill => skill.applies !== 'jetpack' ) ).toBe( true );
	} );

	test( 'every skill has a unique slug and known category, host, and sections', () => {
		expect( unique ).toHaveLength( 18 );
		for ( const skill of unique ) {
			expect( skill.slug ).toMatch( /^[a-z0-9]+(-[a-z0-9]+)*$/ );
			expect( CATEGORY_LABELS[ skill.category ] ).toBeTruthy();
			expect( CATEGORY_ICONS[ skill.category ] ).toBeTruthy();
			expect( APPLIES_LABELS[ skill.applies ] ).toBeTruthy();
			expect( skill.sections.length ).toBeGreaterThan( 0 );
			for ( const section of skill.sections ) {
				expect( SECTION_TITLES[ section.type ] ).toBeTruthy();
				expect( section.items.length ).toBeGreaterThan( 0 );
			}
		}
	} );

	test( 'getSkill only finds skills that run on this kind of site', () => {
		expect( getSkill( 'seo-audit', true )?.title ).toBe( 'SEO audit' );
		expect( getSkill( 'set-up-a-staging-site', true ) ).toBeUndefined();
		expect( getSkill( 'set-up-a-staging-site', false )?.title ).toBe( 'Set up a staging site' );
		expect( getSkill( 'not-a-skill', false ) ).toBeUndefined();
	} );

	test( 'the great first skill runs on both kinds of site', () => {
		expect( getSkill( FIRST_SKILL_SLUG, true )?.applies ).toBe( 'both' );
		expect( getSkill( FIRST_SKILL_SLUG, false ) ).toBeTruthy();
	} );

	test( 'the prompt names the skill and the site, then asks', () => {
		expect( buildPrompt( getSkill( 'seo-audit', true ), 'example.com' ) ).toBe(
			'Use the WordPress.com connector to run the seo-audit skill on example.com. Run an SEO audit and show me the top five fixes.'
		);
	} );
} );
