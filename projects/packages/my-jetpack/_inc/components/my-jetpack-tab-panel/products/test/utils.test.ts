/**
 * @jest-environment node
 */
import { buildCards, filterSections, searchAndRankItems } from '../utils';
import type { ProductCamelCase } from '../../../../data/types';
import type { MyJetpackModule } from '../../../../types';
import type { CardItem, ProductSection } from '../types';

/**
 * Build a minimal card fixture with only the fields the search ranks against.
 *
 * @param {object} fields                 - Partial product fields.
 * @param          fields.slug            - The product slug.
 * @param          fields.name            - The product name.
 * @param          fields.title           - The product title (defaults to the name).
 * @param          fields.description     - The short description.
 * @param          fields.longDescription - The long description.
 * @return A CardItem suitable for the ranking helpers.
 */
function makeCard( fields: {
	slug: string;
	name: string;
	title?: string;
	description?: string;
	longDescription?: string;
} ): CardItem {
	return {
		product: {
			slug: fields.slug,
			name: fields.name,
			title: fields.title ?? fields.name,
			description: fields.description ?? '',
			longDescription: fields.longDescription ?? '',
		} as unknown as ProductCamelCase,
	};
}

/**
 * Build a minimal module fixture.
 *
 * @param {object} fields                  - Partial module fields.
 * @param          fields.module           - The module slug.
 * @param          fields.name             - The module name.
 * @param          fields.description      - The short description.
 * @param          fields.long_description - The long description.
 * @param          fields.search_terms     - The curated search terms.
 * @return A MyJetpackModule suitable for the ranking helpers.
 */
function makeModule( fields: {
	module: string;
	name: string;
	description?: string;
	long_description?: string;
	search_terms?: string;
} ): MyJetpackModule {
	return {
		module: fields.module,
		name: fields.name,
		description: fields.description ?? '',
		long_description: fields.long_description ?? '',
		search_terms: fields.search_terms ?? '',
		available: true,
		activated: false,
	};
}

const forms = makeCard( {
	slug: 'jetpack-forms',
	name: 'Forms',
	description: 'Build and share forms to collect leads, feedback, and payments.',
} );
const akismet = makeCard( {
	slug: 'akismet',
	name: 'Akismet Anti-spam',
	description: 'Automatically clear spam from comments and forms.',
} );
const stats = makeCard( {
	slug: 'stats',
	name: 'Stats',
	description: 'Clear, concise, and actionable analysis of your site performance.',
} );

describe( 'buildCards', () => {
	const productA = makeCard( { slug: 'a', name: 'A' } ).product;

	it( 'skips slugs whose product is unavailable (regression: undefined-product crash)', () => {
		const result = buildCards( [ 'a', 'missing' ], { a: productA }, {}, {} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].product.slug ).toBe( 'a' );
	} );

	it( 'pairs a card with its module via the productModules override', () => {
		const vaultpress = makeModule( { module: 'vaultpress', name: 'Backup' } );
		const result = buildCards( [ 'a' ], { a: productA }, { vaultpress }, { a: 'vaultpress' } );

		expect( result[ 0 ].module?.module ).toBe( 'vaultpress' );
	} );

	it( 'returns an empty array when no products are loaded', () => {
		expect( buildCards( [ 'a', 'b' ], {}, {}, {} ) ).toEqual( [] );
	} );
} );

describe( 'filterSections', () => {
	const sections: Array< ProductSection > = [
		{ id: 'security', title: 'Security', cards: [ akismet ], modules: [] },
		{ id: 'growth', title: 'Growth', cards: [ stats, forms ], modules: [] },
	];

	it( 'floats the section holding the strongest match to the top', () => {
		const result = filterSections( sections, { search: 'form' } );

		expect( result[ 0 ].id ).toBe( 'growth' );
		expect( result[ 0 ].cards?.[ 0 ].product.slug ).toBe( 'jetpack-forms' );
	} );

	it( 'drops sections with no matches', () => {
		const result = filterSections( sections, { search: 'stats' } );

		expect( result.every( section => section.id !== 'security' ) ).toBe( true );
	} );

	it( 'returns the sections untouched when there is no search term', () => {
		expect( filterSections( sections, { search: '' } ) ).toBe( sections );
		expect( filterSections( sections, { search: undefined } ) ).toBe( sections );
	} );
} );

describe( 'searchAndRankItems', () => {
	const formsModule = makeModule( {
		module: 'contact-form',
		name: 'Forms',
		description: 'Add contact, registration, and feedback forms directly from the block editor.',
	} );

	it( 'ranks the best match first regardless of whether it is a card or a module', () => {
		// The Forms module (exact name match) must lead the Akismet card (description-only match).
		const result = searchAndRankItems( [ akismet ], [ formsModule ], 'forms' );

		expect( result[ 0 ] ).toMatchObject( { kind: 'module' } );
		expect( result[ 0 ].kind === 'module' && result[ 0 ].module.module ).toBe( 'contact-form' );
	} );

	it( 'returns a flat mix of cards and modules', () => {
		const result = searchAndRankItems( [ akismet, forms ], [ formsModule ], 'forms' );
		const kinds = result.map( item => item.kind );

		expect( kinds ).toContain( 'card' );
		expect( kinds ).toContain( 'module' );
	} );

	it( 'does not surface unrelated products via fuzzy description matches', () => {
		// "Stats"/"Boost" only relate to "forms" through "performance" — must not appear.
		const result = searchAndRankItems( [ stats ], [], 'forms' );

		expect( result ).toEqual( [] );
	} );

	it( 'de-duplicates a product that appears more than once', () => {
		const result = searchAndRankItems( [ forms, forms ], [], 'forms' );

		expect( result ).toHaveLength( 1 );
	} );

	it( 'drops a standalone module already attached to a matching card (Forms regression)', () => {
		// buildCards attaches the contact-form module to the Forms card, while contact-form is
		// ALSO listed as a standalone module. The card already represents it, so it appears once.
		const formsWithModule: CardItem = { ...forms, module: formsModule };
		const result = searchAndRankItems( [ formsWithModule ], [ formsModule ], 'forms' );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ] ).toMatchObject( { kind: 'card' } );
	} );

	it( 'drops a standalone module whose slug matches a card product slug (VideoPress regression)', () => {
		// VideoPress is a card (slug "videopress") and is also listed as a "videopress" module.
		const videopressCard = makeCard( { slug: 'videopress', name: 'VideoPress' } );
		const videopressModule = makeModule( { module: 'videopress', name: 'VideoPress' } );
		const cardWithModule: CardItem = { ...videopressCard, module: videopressModule };
		const result = searchAndRankItems( [ cardWithModule ], [ videopressModule ], 'videopress' );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ] ).toMatchObject( { kind: 'card' } );
	} );

	it( 'returns an empty array when nothing matches', () => {
		expect( searchAndRankItems( [ forms ], [ formsModule ], 'zzzznotathing' ) ).toEqual( [] );
	} );

	it( 'returns an empty array when there is no search term', () => {
		expect( searchAndRankItems( [ forms ], [ formsModule ], '' ) ).toEqual( [] );
		expect( searchAndRankItems( [ forms ], [ formsModule ], undefined ) ).toEqual( [] );
	} );

	it( 'returns every item in a category when searching the category name', () => {
		// Neither item mentions "security" in its name/description — only the category does.
		const monitor = makeModule( {
			module: 'monitor',
			name: 'Monitor',
			description: 'Downtime alerts.',
		} );
		const result = searchAndRankItems( [ akismet ], [ monitor ], 'security', {
			cardCategories: new Map( [ [ akismet.product.slug, [ 'Security' ] ] ] ),
			moduleCategories: new Map( [ [ 'monitor', [ 'Security' ] ] ] ),
		} );

		expect( result ).toHaveLength( 2 );
	} );

	it( 'does not match a category an item does not belong to', () => {
		const result = searchAndRankItems( [ akismet ], [], 'performance', {
			cardCategories: new Map( [ [ akismet.product.slug, [ 'Security' ] ] ] ),
		} );

		expect( result ).toEqual( [] );
	} );

	it( 'requires every word of a multi-word category query to match a label (AND across labels)', () => {
		// With one field per label, "performance recommended" matches an item in BOTH categories
		// (each word exact-matches its own label), while an item in only "Performance" drops out —
		// the "recommended" term has no field to match. Guards the AND-across-separate-fields
		// contract of scoreFields that per-label scoring now leans on; a refactor collapsing the
		// labels back into one field would silently let the "Performance"-only item through.
		const both = makeCard( { slug: 'both', name: 'Both' } );
		const onlyPerf = makeCard( { slug: 'only-perf', name: 'OnlyPerf' } );
		const cardCategories = new Map( [
			[ both.product.slug, [ 'Performance', 'Recommended' ] ],
			[ onlyPerf.product.slug, [ 'Performance' ] ],
		] );

		const result = searchAndRankItems( [ both, onlyPerf ], [], 'performance recommended', {
			cardCategories,
		} );

		expect( result ).toHaveLength( 1 );
		expect( result[ 0 ].kind === 'card' && result[ 0 ].card.product.slug ).toBe( 'both' );
	} );

	it( 'keeps a stable order whether a category word is partially or fully typed', () => {
		// Two cards both in "Performance"; `multi` is also in "Recommended". Each category label is
		// scored on its own, so completing the word "Performance" boosts both equally and does not
		// reshuffle them — previously the joined "Performance Recommended" label could only ever
		// prefix-match, so `multi` lost the exact-match bonus and got overtaken on the last keystroke.
		const single = makeCard( { slug: 'single', name: 'Single' } );
		const multi = makeCard( { slug: 'multi', name: 'Multi' } );
		const cardCategories = new Map( [
			[ single.product.slug, [ 'Performance' ] ],
			[ multi.product.slug, [ 'Performance', 'Recommended' ] ],
		] );

		const order = ( result: ReturnType< typeof searchAndRankItems > ) =>
			result.map( item => ( item.kind === 'card' ? item.card.product.slug : item.module.module ) );

		// `multi` is listed first so the old behavior (it getting overtaken) is observable.
		const partial = searchAndRankItems( [ multi, single ], [], 'Performanc', { cardCategories } );
		const full = searchAndRankItems( [ multi, single ], [], 'Performance', { cardCategories } );

		expect( order( full ) ).toHaveLength( 2 );
		expect( order( partial ) ).toEqual( order( full ) );
	} );

	it( 'is case-insensitive', () => {
		const lower = searchAndRankItems( [ akismet, forms ], [], 'forms' );
		const upper = searchAndRankItems( [ akismet, forms ], [], 'FORMS' );

		expect( upper[ 0 ] ).toEqual( lower[ 0 ] );
		expect( upper[ 0 ].kind === 'card' && upper[ 0 ].card.product.slug ).toBe( 'jetpack-forms' );
	} );

	it( 'does not match on the slug (regression for the old JSON.stringify search)', () => {
		// "jetpack-forms" only appears as a slug here; the product name is "Stats".
		const onlySlug = makeCard( { slug: 'jetpack-forms', name: 'Stats' } );

		expect( searchAndRankItems( [ onlySlug ], [], 'jetpack-forms' ) ).toEqual( [] );
	} );

	it( 'matches a module via its curated search terms', () => {
		const newsletter = makeModule( {
			module: 'subscriptions',
			name: 'Newsletter',
			description: 'Grow your subscriber list and deliver your content to their inbox.',
			search_terms: 'subscriptions, subscribers, email',
		} );
		const result = searchAndRankItems( [], [ newsletter ], 'subscribers' );

		expect( result[ 0 ].kind === 'module' && result[ 0 ].module.module ).toBe( 'subscriptions' );
	} );
} );
