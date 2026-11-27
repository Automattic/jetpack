import { buildPrompt, getCatalog, getCategoryName, getSkill } from '../skills';
import { SKILLS_INDEX } from './fixtures';

describe( 'Discover skills', () => {
	beforeEach( () => {
		window.jetpackAiSettings = { skills: SKILLS_INDEX };
	} );

	afterEach( () => {
		delete window.jetpackAiSettings;
	} );

	test.each( [
		[ 'missing', undefined ],
		[ 'null, as with the flag off', null ],
		[ 'malformed', { skills: 'nope' } ],
	] )( 'an index that is %s reads as an empty catalog', ( _, skills ) => {
		window.jetpackAiSettings = { skills };

		expect( getCatalog() ).toEqual( [] );
		expect( getSkill( 'site-seo-audit' ) ).toBeUndefined();
		expect( getCategoryName( 'seo' ) ).toBe( '' );
	} );

	test.each( [
		[ 'listed after it', [ 'seo', 'good-first-skills' ], 'seo' ],
		[ 'listed before it, as the catalog sorts by name', [ 'good-first-skills', 'seo' ], 'seo' ],
		[ 'the only one', [ 'good-first-skills' ], 'good-first-skills' ],
	] )( 'a skill’s own category skips Good first skills %s', ( _, categories, own ) => {
		window.jetpackAiSettings = {
			skills: { ...SKILLS_INDEX, skills: [ { slug: 'a-skill', title: 'A skill', categories } ] },
		};

		expect( getSkill( 'a-skill' ).category ).toBe( own );
	} );

	test( 'reads skills and category names from the index', () => {
		expect( getCatalog() ).toHaveLength( SKILLS_INDEX.skills.length );
		expect( getSkill( 'site-seo-audit' )?.title ).toBe( 'SEO audit' );
		expect( getSkill( 'not-a-skill' ) ).toBeUndefined();
		expect( getCategoryName( 'seo-ai-search' ) ).toBe( 'SEO' );
	} );

	test.each( [
		[
			'aims a prompt that names the connector at this site',
			'Use the WordPress.com connector to run the SEO audit on example.com',
			'Use the WordPress.com connector to run the SEO audit on mysite.blog',
		],
		[
			'adds the site to a connector prompt that names none',
			'Use the WordPress.com connector to check my contact page.',
			'Use the WordPress.com connector to check my contact page on mysite.blog',
		],
		[
			'leads a bare request with the connector and the skill',
			'Who has access to my site?',
			'Use the WordPress.com connector to run the SEO audit skill on mysite.blog. Who has access to my site?',
		],
	] )( 'the prompt %s', ( _, tryPrompt, expected ) => {
		expect( buildPrompt( { title: 'SEO audit', tryPrompt }, 'mysite.blog' ) ).toBe( expected );
	} );
} );
