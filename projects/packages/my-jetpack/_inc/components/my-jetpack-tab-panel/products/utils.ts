import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { JETPACK_PRODUCTS_NOT_FOR_MULTISITE } from '../../../constants';
import { ProductCamelCase } from '../../../data/types';
import { JetpackModuleSlug, MyJetpackModule } from '../../../types';
import { CardItem, ProductFilter, ProductSection, SearchResultItem } from './types';

/**
 * Legacy modules that should only appear in the module list when they are already active.
 * New users will not see these modules; existing users keep the ability to deactivate them.
 */
const LEGACY_MODULES_VISIBLE_ONLY_WHEN_ACTIVE: readonly string[] = [
	'google-fonts' satisfies JetpackModuleSlug,
];

/**
 * Get the choices for the products filter.
 *
 * @return The choices for the products filter.
 */
export function getProductsFilterChoices() {
	const choices: Array< {
		label: string;
		value: ProductFilter;
	} > = [
		{
			label: __( 'All categories', 'jetpack-my-jetpack' ),
			value: 'all',
		},
		{
			label: __( 'Recommended', 'jetpack-my-jetpack' ),
			value: 'recommended',
		},
		{
			label: __( 'Included in plan', 'jetpack-my-jetpack' ),
			value: 'included',
		},
		{
			label: __( 'Security', 'jetpack-my-jetpack' ),
			value: 'security',
		},
		{
			label: __( 'Growth', 'jetpack-my-jetpack' ),
			value: 'growth',
		},
		{
			label: __( 'Performance', 'jetpack-my-jetpack' ),
			value: 'performance',
		},
		{
			label: __( 'Other', 'jetpack-my-jetpack' ),
			value: 'other',
		},
	];

	return choices;
}

/**
 * Get the title for a section based on its id.
 * @param {string} section - The section id.
 * @return  The title of the section, or undefined if not found.
 */
export function getSectionTitle( section: string ) {
	const option = getProductsFilterChoices().find( item => item.value === section );

	return option?.label;
}

/**
 * Check if a string is a valid ProductFilter.
 *
 * @param {string | null} value - The value to check.
 * @return True if the value is a valid ProductFilter.
 */
export function isValidFilter( value: string | null ): value is ProductFilter {
	return getProductsFilterChoices().some( item => item.value === value );
}

/**
 * A field to match against, with a relevance weight. Name/title dominate, then the curated
 * search terms, then the description. Noisy fields (slugs, URLs, pricing) are intentionally
 * excluded so a direct title match always outranks an incidental mention.
 */
type ScoredField = { value: string | undefined; weight: number };

/**
 * A parsed search term: the lowercased text plus a precompiled word-boundary matcher, so the
 * RegExp is built once per search rather than once per field/item in the scoring loop.
 */
type SearchTerm = { text: string; wordRe: RegExp };

/**
 * Whether a search term is meaningful (non-empty after trimming).
 *
 * @param {string | undefined} search - The raw search term.
 * @return True when the term should trigger ranking/filtering.
 */
function hasSearch( search: string | undefined ): search is string {
	return Boolean( search?.trim() );
}

/**
 * Escape a string for safe use inside a RegExp.
 *
 * @param {string} value - The string to escape.
 * @return The escaped string.
 */
function escapeRegExp( value: string ): string {
	return value.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
}

/**
 * Parse a search string into lowercased terms, each with a precompiled word-boundary matcher.
 *
 * @param {string} search - The search term.
 * @return The individual parsed terms.
 */
function searchTerms( search: string ): Array< SearchTerm > {
	return search
		.toLowerCase()
		.split( /\s+/ )
		.filter( Boolean )
		.map( text => ( { text, wordRe: new RegExp( `\\b${ escapeRegExp( text ) }` ) } ) );
}

/**
 * Score a single term against a field value. Higher is a better match, 0 means no match.
 * Tiers: exact > prefix > word-start > substring.
 *
 * @param {SearchTerm}         term  - The parsed search term.
 * @param {string | undefined} value - The field value to test.
 * @return The match score for this field.
 */
function scoreTerm( term: SearchTerm, value: string | undefined ): number {
	if ( ! value ) {
		return 0;
	}

	const haystack = value.toLowerCase();

	if ( haystack === term.text ) {
		return 100;
	}
	if ( haystack.startsWith( term.text ) ) {
		return 75;
	}
	if ( term.wordRe.test( haystack ) ) {
		return 50;
	}
	if ( haystack.includes( term.text ) ) {
		return 25;
	}

	return 0;
}

/**
 * Score an item (described by its weighted fields) against the search. Every term must match
 * at least one field (AND semantics); the item's score is the sum of each term's best weighted
 * field score. Returns 0 when any term is unmatched, so the item is filtered out.
 *
 * @param {Array<SearchTerm>}  terms  - The parsed search terms.
 * @param {Array<ScoredField>} fields - The weighted fields to match against.
 * @return The item's total relevance score, or 0 when it does not match.
 */
function scoreFields( terms: Array< SearchTerm >, fields: Array< ScoredField > ): number {
	let total = 0;

	for ( const term of terms ) {
		let best = 0;
		for ( const field of fields ) {
			best = Math.max( best, scoreTerm( term, field.value ) * field.weight );
		}
		if ( best === 0 ) {
			return 0;
		}
		total += best;
	}

	return total;
}

/**
 * Score, filter, and sort a list of items by relevance — the shared map → score → filter (>0)
 * → sort (best first) pipeline used by every ranking helper.
 *
 * @param {Array<T>}          items     - The items to rank.
 * @param {Array<SearchTerm>} terms     - The parsed search terms.
 * @param {Function}          fieldsFor - Maps an item to its weighted fields.
 * @return The matching items with their scores, best match first.
 */
function rankBy< T >(
	items: Array< T >,
	terms: Array< SearchTerm >,
	fieldsFor: ( item: T ) => Array< ScoredField >
): Array< { item: T; score: number } > {
	return items
		.map( item => ( { item, score: scoreFields( terms, fieldsFor( item ) ) } ) )
		.filter( ( { score } ) => score > 0 )
		.sort( ( a, b ) => b.score - a.score );
}

/**
 * One weighted field per category label. Each label is scored on its own rather than against a
 * space-joined blob, so a multi-category item can still land an exact-match on a single category
 * word. Otherwise completing that word reshuffles results: a single-category item's joined label
 * already exact-matches the word, but a multi-category item's joined label (e.g. "Performance
 * Recommended") can only prefix-match it — so only the multi-category item misses the exact-match
 * bonus and gets overtaken on the final keystroke. See `scoreTerm` for the match tiers.
 *
 * @param {string[] | undefined} categories - The item's category labels.
 * @return One scored field per label (empty when there are no labels).
 */
function categoryFields( categories?: string[] ): Array< ScoredField > {
	return ( categories ?? [] ).map( label => ( { value: label, weight: 2 } ) );
}

/**
 * The weighted fields for a product card. When provided, the categories the card belongs to
 * are matchable too, so searching a category name surfaces every item in that category.
 *
 * @param {CardItem}             card       - The card.
 * @param {string[] | undefined} categories - The card's category labels.
 * @return The weighted fields to match against.
 */
function cardFields( card: CardItem, categories?: string[] ): Array< ScoredField > {
	return [
		{ value: card.product.name, weight: 3 },
		{ value: card.product.title, weight: 3 },
		{ value: card.module?.name, weight: 3 },
		{ value: card.module?.search_terms, weight: 2 },
		...categoryFields( categories ),
		{ value: card.product.description, weight: 1 },
		{ value: card.module?.description, weight: 1 },
	];
}

/**
 * The weighted fields for a standalone module. When provided, the categories the module
 * belongs to are matchable too.
 *
 * @param {MyJetpackModule}      module     - The module.
 * @param {string[] | undefined} categories - The module's category labels.
 * @return The weighted fields to match against.
 */
function moduleFields( module: MyJetpackModule, categories?: string[] ): Array< ScoredField > {
	return [
		{ value: module.name, weight: 3 },
		{ value: module.search_terms, weight: 2 },
		...categoryFields( categories ),
		{ value: module.description, weight: 1 },
	];
}

/**
 * Filter sections based on the search term, ranking the cards and modules within each section
 * by relevance and floating the section that holds the strongest match to the top.
 * Used by the "Included in plan" view, which keeps its per-plan grouping.
 *
 * @param {Array<ProductSection>} sections       - The sections to filter.
 * @param {object}                options        - The options for filtering sections.
 * @param {string | undefined}    options.search - The search term.
 * @return  The filtered, ranked sections.
 */
export function filterSections(
	sections: Array< ProductSection >,
	{ search }: { search: string | undefined }
): Array< ProductSection > {
	if ( ! hasSearch( search ) ) {
		return sections;
	}

	const terms = searchTerms( search );

	return sections
		.map( section => {
			const cards = rankBy( section.cards ?? [], terms, card => cardFields( card ) );
			const modules = rankBy( section.modules ?? [], terms, module => moduleFields( module ) );
			const bestScore = Math.max(
				0,
				...cards.map( ( { score } ) => score ),
				...modules.map( ( { score } ) => score )
			);

			return {
				section: {
					...section,
					cards: cards.map( ( { item } ) => item ),
					modules: modules.map( ( { item } ) => item ),
				},
				bestScore,
			};
		} )
		.filter( ( { section } ) => section.cards.length || section.modules.length )
		.sort( ( a, b ) => b.bestScore - a.bestScore )
		.map( ( { section } ) => section );
}

/**
 * Search across all cards and modules and return a single relevance-ranked list of items.
 * Cards and modules are de-duplicated (some products appear in more than one category) and
 * ranked on one scale, so the strongest match leads regardless of its type. Returns an empty
 * array when there is no search term — the caller falls back to the category browse view.
 *
 * Category matching is intentionally a capability of this unified search view only: callers
 * pass `categories` so typing a category name surfaces its items. The browse/per-section paths
 * (`filterSections`) omit it because category context there is already provided by grouping.
 *
 * @param {Array<CardItem>}        cards                         - All cards in scope.
 * @param {Array<MyJetpackModule>} modules                       - All modules in scope.
 * @param {string | undefined}     search                        - The search term.
 * @param {object}                 [categories]                  - Per-item category labels for category search.
 * @param {Map<string, string[]>}  [categories.cardCategories]   - Card slug to category labels.
 * @param {Map<string, string[]>}  [categories.moduleCategories] - Module slug to category labels.
 * @return  The matching items ordered best match first.
 */
export function searchAndRankItems(
	cards: Array< CardItem >,
	modules: Array< MyJetpackModule >,
	search: string | undefined,
	categories?: {
		cardCategories?: Map< string, string[] >;
		moduleCategories?: Map< string, string[] >;
	}
): Array< SearchResultItem > {
	if ( ! hasSearch( search ) ) {
		return [];
	}

	const terms = searchTerms( search );

	// One slug space governs de-duplication: a card claims both its product slug and the slug of
	// the module it already carries, so the same product never surfaces as both a card and a
	// standalone module (e.g. Forms' contact-form module, or VideoPress listed in two categories).
	const seen = new Set< string >();
	const items: Array< SearchResultItem > = [];

	cards.forEach( card => {
		if ( card?.product?.slug && ! seen.has( card.product.slug ) ) {
			seen.add( card.product.slug );
			if ( card.module?.module ) {
				seen.add( card.module.module );
			}
			items.push( { kind: 'card', card } );
		}
	} );
	modules.forEach( module => {
		if ( module?.module && ! seen.has( module.module ) ) {
			seen.add( module.module );
			items.push( { kind: 'module', module } );
		}
	} );

	return rankBy( items, terms, item =>
		item.kind === 'card'
			? cardFields( item.card, categories?.cardCategories?.get( item.card.product.slug ) )
			: moduleFields( item.module, categories?.moduleCategories?.get( item.module.module ) )
	).map( ( { item } ) => item );
}

/**
 * Build the product cards for a set of card slugs, pairing each product with its module.
 * Slugs whose product is not loaded (unavailable on this site, or still loading) are skipped
 * so callers never dereference an undefined product.
 *
 * @param {Array<string>}                    slugs          - The product card slugs.
 * @param {Record<string, ProductCamelCase>} products       - Products keyed by slug.
 * @param {Record<string, MyJetpackModule>}  modules        - Modules keyed by slug.
 * @param {Record<string, string>}           productModules - Card slug to module slug overrides.
 * @return The resolved cards, with unavailable products skipped.
 */
export function buildCards(
	slugs: Array< string >,
	products: Record< string, ProductCamelCase >,
	modules: Record< string, MyJetpackModule >,
	productModules: Record< string, string >
): Array< CardItem > {
	return slugs
		.map< CardItem | null >( slug => {
			const product = products[ slug ];
			if ( ! product ) {
				return null;
			}
			return { product, module: modules[ productModules[ slug ] || slug ] };
		} )
		.filter( ( card ): card is CardItem => card !== null );
}

/**
 * Filter and sort modules based on their name.
 *
 * @param {Array<MyJetpackModule>} modules - The modules to filter and sort.
 * @return The filtered and sorted modules.
 */
export function filterAndSortModules(
	modules: Array< MyJetpackModule >
): Array< MyJetpackModule > {
	const $modules = [ ...modules ]
		.filter( Boolean )
		.filter( m => ! LEGACY_MODULES_VISIBLE_ONLY_WHEN_ACTIVE.includes( m.module ) || m.activated );

	$modules.sort( ( a, b ) => a.name.localeCompare( b.name ) );

	return $modules;
}

/**
 * Get the status of a product based on its availability.
 *
 * @param {ProductCamelCase} product - The product to check.
 *
 * @return True if the product is supported, false otherwise.
 */
export function getProductStatus( product: ProductCamelCase ) {
	// If the product is not supported on multisite, we set the available to false and provide a reason.
	if ( getScriptData().site.is_multisite ) {
		if (
			JETPACK_PRODUCTS_NOT_FOR_MULTISITE.includes(
				product.slug as ( typeof JETPACK_PRODUCTS_NOT_FOR_MULTISITE )[ number ]
			)
		) {
			return {
				isAvailable: false,
				reason: __( 'Not available on multisite', 'jetpack-my-jetpack' ),
			};
		}
	}

	return { isAvailable: true };
}
