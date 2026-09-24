import { JetpackModuleSlug, MyJetpackModule } from '../../../types';

/**
 * Legacy modules that should only appear in the module list when they are already active.
 * New users will not see these modules; existing users keep the ability to deactivate them.
 */
const LEGACY_MODULES_VISIBLE_ONLY_WHEN_ACTIVE: readonly string[] = [
	'google-fonts' satisfies JetpackModuleSlug,
];

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
export function hasSearch( search: string | undefined ): search is string {
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
export function searchTerms( search: string ): Array< SearchTerm > {
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
export function rankBy< T >(
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
 * The weighted fields for a standalone module.
 *
 * @param {MyJetpackModule} module - The module.
 * @return The weighted fields to match against.
 */
export function moduleFields( module: MyJetpackModule ): Array< ScoredField > {
	return [
		{ value: module.name, weight: 3 },
		{ value: module.search_terms, weight: 2 },
		{ value: module.description, weight: 1 },
	];
}

/**
 * Filter and sort modules based on their name.
 *
 * A module the site could not translate arrives with a null name, so sort off the slug rather
 * than let one comparison take down the whole tab.
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

	const sortKey = ( m: MyJetpackModule ) => m.name || m.module;
	$modules.sort( ( a, b ) => sortKey( a ).localeCompare( sortKey( b ) ) );

	return $modules;
}
