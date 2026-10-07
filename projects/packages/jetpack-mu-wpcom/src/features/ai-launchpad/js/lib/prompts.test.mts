import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	buildTailorPrompt,
	chooseTailoringMenu,
	isEnglishLocale,
	languageDisplayName,
	TASK_ANNOTATIONS,
	TASK_MENU,
} from './prompts.ts';
import { AGENT_OUTPUT_SCHEMA } from './schema-validator.ts';
import type { WizardInput } from './types.ts';

// No ui_locale, like an input persisted before it existed.
const INPUT = {
	goal: 'write',
	site_name: 'Alpine Notes',
	description: 'Personal blog about long-distance hiking in the Alps.',
	locale: 'en',
} as WizardInput;

describe( 'TASK_ANNOTATIONS', () => {
	it( 'has no duplicate ids', () => {
		assert.equal( new Set( TASK_MENU ).size, TASK_MENU.length );
	} );

	it( 'gives every entry a non-empty what and pick when', () => {
		for ( const entry of TASK_ANNOTATIONS ) {
			assert.ok( entry.what.length > 0, `${ entry.id } is missing "what"` );
			assert.ok( entry.pickWhen.length > 0, `${ entry.id } is missing "pickWhen"` );
		}
	} );
} );

describe( 'buildTailorPrompt', () => {
	it( 'interpolates goal, site_name, and description', () => {
		const prompt = buildTailorPrompt( INPUT );
		assert.ok( prompt.includes( `Goal: ${ INPUT.goal }` ) );
		assert.ok( prompt.includes( `Site name: ${ INPUT.site_name }` ) );
		assert.ok( prompt.includes( `User description: ${ INPUT.description }` ) );
	} );

	it( 'renders each offered task as an annotated block, not a bare id', () => {
		const prompt = buildTailorPrompt( INPUT, [ 'first_post_published', 'site_launched' ] );

		assert.match( prompt, /- id: first_post_published\n {2}what: .+\n {2}pick when: .+/ );
	} );

	it( 'restricts the offered menu to the available tasks when given', () => {
		const available = [ 'first_post_published', 'site_theme_selected', 'site_launched' ];
		const prompt = buildTailorPrompt( INPUT, available );
		const offered = [ ...prompt.matchAll( /^- id: (\S+)$/gm ) ].map( match => match[ 1 ] );

		assert.deepEqual( offered.sort(), [ ...available ].sort() );
	} );

	it( 'falls back to the full menu when availability is unknown', () => {
		const prompt = buildTailorPrompt( INPUT, [] );

		for ( const id of TASK_MENU ) {
			assert.ok( prompt.includes( `- id: ${ id }` ), `${ id } missing from full menu` );
		}
	} );

	it( 'renders optional fields only when present', () => {
		const withAvoid = TASK_ANNOTATIONS.find( entry => entry.avoidWhen );
		const withoutAvoid = TASK_ANNOTATIONS.find( entry => ! entry.avoidWhen );
		assert.ok( withAvoid && withoutAvoid, 'table needs both shapes to exercise this' );

		const prompt = buildTailorPrompt( INPUT, [ withAvoid.id, withoutAvoid.id ] );
		const blocks = prompt.split( '- id: ' );
		const plainBlock = blocks.find( block => block.startsWith( `${ withoutAvoid.id }\n` ) );

		assert.ok( prompt.includes( `  avoid when: ${ withAvoid.avoidWhen }` ) );
		assert.ok( plainBlock && ! plainBlock.includes( 'avoid when:' ) );
	} );

	it( 'lists only server-enforced rules under the HARD RULES header', () => {
		// Pinned to the exact strings: the header tells the model each of these is rejected server-side.
		const prompt = buildTailorPrompt( INPUT, [] );
		const block = prompt.slice( prompt.indexOf( 'HARD RULES' ) ).split( '\n\n' )[ 0 ];
		const bullets = block.split( '\n' ).filter( line => line.startsWith( '- ' ) );

		assert.deepEqual( bullets, [
			'- Every "id" MUST be copied verbatim from the menu below. Never invent IDs: the server drops any id it cannot recognize, and rejects the whole list if too few tasks survive.',
			'- Return exactly 6 tasks.',
			'- The 6th and final task MUST be a launch task: "site_launched" (canonical) or "blog_launched".',
			'- Subtitles must be plain text: no URLs, no HTML, and no template syntax such as {{ }} or [[ ]].',
		] );
	} );

	it( 'offers the actionable ids while enough of them remain on the menu', () => {
		const actionable = TASK_MENU.slice( 0, 12 );
		const renderable = [ ...actionable, 'first_post_published_extra' ];
		assert.equal( chooseTailoringMenu( actionable, renderable ), actionable );
	} );

	it( 'relaxes to the renderable ids when completion leaves too few actionable menu tasks', () => {
		// Ids off the menu do not count toward the threshold: the prompt's menu is the intersection.
		const actionable = [ ...TASK_MENU.slice( 0, 4 ), 'off_menu_task_a', 'off_menu_task_b' ];
		const renderable = TASK_MENU.slice( 0, 20 );
		assert.equal( chooseTailoringMenu( actionable, renderable ), renderable );
	} );

	it( 'lists every theme_category slug the schema accepts', () => {
		const prompt = buildTailorPrompt( INPUT );
		for ( const slug of AGENT_OUTPUT_SCHEMA.properties?.inferred.properties?.theme_category.enum ??
			[] ) {
			assert.ok( prompt.includes( `${ slug } = ` ), `${ slug } missing from the prompt` );
		}
	} );

	// Listing every page intro key in the format template made the model fill the unchosen ones with "" or null.
	it( 'shows a single page_intros key in the output template', () => {
		const template = buildTailorPrompt( INPUT ).split( '============ format ============' )[ 1 ];
		assert.match( template, /"page_intros": \{ "add_contact_page": "\.\.\." \}/ );
		assert.ok( ! /add_(events|video|gallery)_page/.test( template ) );
	} );

	it( 'asks for exactly the page_intros keys the schema accepts', () => {
		const prompt = buildTailorPrompt( INPUT );
		const keys = [ ...prompt.matchAll( /^- "(add_[a-z_]+)": /gm ) ].map( match => match[ 1 ] );

		assert.deepEqual(
			keys,
			Object.keys( AGENT_OUTPUT_SCHEMA.properties?.page_intros.properties ?? {} )
		);
	} );
} );

describe( 'buildTailorPrompt output language', () => {
	const LANGUAGE_HEADER = '============ output language ============';
	const languageBlock = ( prompt: string ) =>
		prompt.slice( prompt.indexOf( LANGUAGE_HEADER ) ).split( '\n\n' )[ 0 ];

	it( 'tells an English site to write in English even when the description is not', () => {
		const block = languageBlock(
			buildTailorPrompt( {
				...INPUT,
				description: "Un'azienda di creativi!",
				locale: 'en_US',
				ui_locale: 'en_US',
			} )
		);

		assert.match( block, /The site's language is [^.]*English \(locale "en_US"\)/ );
		assert.match( block, /even when the site name or description is written in another language/ );
		assert.ok( ! block.includes( 'do not fall back to English' ) );
	} );

	it( 'does not split the subtitles between two different Englishes', () => {
		for ( const [ locale, ui ] of [
			[ 'en_US', 'en_GB' ],
			[ 'en', 'en_AU' ],
		] ) {
			const prompt = buildTailorPrompt( { ...INPUT, locale, ui_locale: ui } );
			assert.ok( ! prompt.includes( 'Two languages are in play' ), `${ locale } / ${ ui }` );
		}
	} );

	it( 'names the site language and forbids an English fallback for other locales', () => {
		const block = languageBlock(
			buildTailorPrompt( { ...INPUT, locale: 'it_IT', ui_locale: 'it_IT' } )
		);

		assert.match( block, /The site's language is Italian[^.]*\(locale "it_IT"\)/ );
		assert.ok( block.includes( 'do not fall back to English' ) );
		// The server validates these against English enums, so the model must not translate them.
		for ( const slug of [ '"goal"', '"inferred_goal"', '"theme_category"', '"id"' ] ) {
			assert.ok( block.includes( slug ), `${ slug } is not pinned to English` );
		}
	} );

	it( 'treats only en* locales as English', () => {
		for ( const locale of [ 'en', 'en_US', 'en-gb', 'EN' ] ) {
			assert.ok( isEnglishLocale( locale ), locale );
		}
		for ( const locale of [ 'it_IT', 'es', 'eng', 'enm', 'pt_BR' ] ) {
			assert.ok( ! isEnglishLocale( locale ), locale );
		}
	} );

	it( 'splits the languages when the account language differs from the site language', () => {
		const block = languageBlock(
			buildTailorPrompt( { ...INPUT, locale: 'fr_FR', ui_locale: 'it_IT' } )
		);

		// The display name may carry a region ("Italian (Italy)"), so only the language leads the match.
		assert.match( block, /"subtitle" values in Italian[^"]*\(locale "it_IT"\)/ );
		assert.match(
			block,
			/about_page_draft and every page_intros line in French[^"]*\(locale "fr_FR"\)/
		);
	} );

	const stepText = ( prompt: string, step: string ) => {
		const start = prompt.indexOf( `============ ${ step }` );
		return prompt.slice( start, prompt.indexOf( '\n============ ', start + 1 ) );
	};
	const STEP_LANGUAGES: Array< [ string, RegExp ] > = [
		[ 'STEP 2', /Write every subtitle in Italian/ ],
		[ 'STEP 3', /Write it in French[^,]*, NOT in Italian/ ],
		[ 'STEP 4', /Write it in French[^,]*, NOT in Italian/ ],
		[ 'STEP 5', /Write it in French[^,]*, NOT in Italian/ ],
	];
	for ( const [ step, expected ] of STEP_LANGUAGES ) {
		it( `repeats the split language in ${ step }`, () => {
			const prompt = buildTailorPrompt( { ...INPUT, locale: 'fr_FR', ui_locale: 'it_IT' } );
			assert.match( stepText( prompt, step ), expected );
		} );
	}

	it( 'leaves the steps alone when both languages match', () => {
		const prompt = buildTailorPrompt( { ...INPUT, locale: 'it_IT', ui_locale: 'it_IT' } );
		for ( const step of [ 'STEP 2', 'STEP 3', 'STEP 4', 'STEP 5' ] ) {
			assert.ok( ! /Write (every subtitle|it) in /.test( stepText( prompt, step ) ), step );
		}
	} );

	it( 'still splits when only one of the two languages is English', () => {
		const englishSite = buildTailorPrompt( { ...INPUT, locale: 'en_US', ui_locale: 'it_IT' } );
		assert.match( englishSite, /"subtitle" values in Italian/ );
		assert.match( englishSite, /about_page_draft and every page_intros line in [^"]*English/ );

		const englishAdmin = buildTailorPrompt( { ...INPUT, locale: 'it_IT', ui_locale: 'en_US' } );
		assert.match( englishAdmin, /"subtitle" values in [^"]*English/ );

		for ( const prompt of [ englishSite, englishAdmin ] ) {
			assert.ok( ! prompt.includes( 'do not fall back to English' ) );
		}
	} );

	it( 'treats a short WordPress.com locale and its regional form as one language', () => {
		const prompt = buildTailorPrompt( { ...INPUT, locale: 'it', ui_locale: 'it_IT' } );

		assert.ok( ! prompt.includes( 'Two languages are in play' ) );
		assert.match( prompt, /The site's language is Italian/ );
	} );

	it( 'writes everything in the site language when no account language is persisted', () => {
		const prompt = buildTailorPrompt( { ...INPUT, locale: 'it_IT' } );

		assert.ok( ! prompt.includes( 'Two languages are in play' ) );
		assert.match( prompt, /Write these in that language: the task subtitles/ );
	} );

	it( 'resolves a WordPress locale to an English language name, or keeps the code', () => {
		assert.match( languageDisplayName( 'it_IT' ), /^Italian/ );
		assert.match( languageDisplayName( 'pt_BR' ), /Portuguese/ );
		assert.equal( languageDisplayName( '!!' ), '!!' );
	} );
} );
