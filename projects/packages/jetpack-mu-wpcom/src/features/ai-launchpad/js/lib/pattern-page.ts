import apiFetch from '@wordpress/api-fetch';
import type { TailoredInferred } from './types.ts';

const PTK_ENDPOINT = 'https://public-api.wordpress.com/rest/v1/ptk/patterns/en';

interface PtkTaxonomyTerm {
	title?: string;
	slug?: string;
}

// PTK returns categories/tags as a slug-keyed map of terms; an empty taxonomy
// can come back as `[]` rather than `{}`, so both shapes must be handled.
type PtkTaxonomy = Record< string, PtkTaxonomyTerm > | PtkTaxonomyTerm[];

export interface PtkPattern {
	title?: string;
	html?: string;
	categories?: PtkTaxonomy;
	tags?: PtkTaxonomy;
}

interface CreatedPage {
	id: number;
}

/**
 * Tokenize the inferred niche/vibe/audience into lowercase match words. The
 * goal is intentionally excluded: it describes intent (e.g. "sell", "publish")
 * rather than topic, so it adds noise to a topical pattern match.
 *
 * @param inferred - The AI-inferred site details.
 * @return The match words.
 */
function nicheWords( inferred: TailoredInferred ): string[] {
	return [ inferred.niche, inferred.vibe, inferred.audience ]
		.filter( ( value ): value is string => typeof value === 'string' && value.length > 0 )
		.join( ' ' )
		.toLowerCase()
		.split( /[^a-z0-9]+/ )
		.filter( word => word.length > 2 );
}

/**
 * Extract the human-readable term titles from a PTK taxonomy, which may arrive
 * as a slug-keyed map or (when empty) as an array.
 *
 * @param taxonomy - The categories or tags collection.
 * @return The term titles.
 */
function termTitles( taxonomy: PtkTaxonomy | undefined ): string[] {
	const terms = Array.isArray( taxonomy ) ? taxonomy : Object.values( taxonomy ?? {} );
	return terms
		.map( term => term.title )
		.filter( ( title ): title is string => typeof title === 'string' && title.length > 0 );
}

/**
 * Count how many match words appear in a pattern's title, category titles, or
 * tag titles. Categories/tags are keyed by slug, so the matchable text is the
 * term titles, not the keys.
 *
 * @param pattern - The candidate pattern.
 * @param words   - The niche match words.
 * @return The match score.
 */
function score( pattern: PtkPattern, words: string[] ): number {
	const haystack = [
		pattern.title ?? '',
		...termTitles( pattern.categories ),
		...termTitles( pattern.tags ),
	]
		.join( ' ' )
		.toLowerCase();
	return words.reduce( ( total, word ) => ( haystack.includes( word ) ? total + 1 : total ), 0 );
}

/**
 * Pick the pattern best matching the inferred niche, falling back to the first
 * pattern with usable HTML when nothing scores.
 *
 * @param patterns - The fetched patterns.
 * @param inferred - The AI-inferred site details.
 * @return The chosen pattern, or null when none have HTML.
 */
export function pickPattern(
	patterns: PtkPattern[],
	inferred: TailoredInferred
): PtkPattern | null {
	const usable = patterns.filter( pattern => typeof pattern.html === 'string' && pattern.html );
	if ( usable.length === 0 ) {
		return null;
	}
	const words = nicheWords( inferred );
	let best = usable[ 0 ];
	let bestScore = score( best, words );
	for ( const pattern of usable.slice( 1 ) ) {
		const current = score( pattern, words );
		if ( current > bestScore ) {
			best = pattern;
			bestScore = current;
		}
	}
	return best;
}

// The full PTK library is stable within a session, so cache the parsed list in
// module scope: repeated "Get started" clicks reuse it instead of re-downloading
// and re-scoring it. Stays null on a failed fetch so a later click can retry.
let cachedPatterns: PtkPattern[] | null = null;

/**
 * Fetch the English pattern library, pick a pattern matching the inferred
 * niche, and create a draft page from it. Returns the new page id and its
 * block-editor URL. The pattern HTML is used as-is (no AI rewrite for v1).
 *
 * @param inferred - The AI-inferred site details.
 * @return The created page id and its editor URL.
 */
export async function createPatternPage(
	inferred: TailoredInferred
): Promise< { page_id: number; edit_url: string } > {
	if ( cachedPatterns === null ) {
		try {
			const response = await fetch( PTK_ENDPOINT );
			if ( response.ok ) {
				const body = await response.json();
				if ( Array.isArray( body ) ) {
					cachedPatterns = body as PtkPattern[];
				}
			}
		} catch {
			// Network/parse failure: leave the cache unset so a later click retries.
			// The page is still created below (with empty content) rather than
			// throwing and stranding the CTA.
		}
	}
	const pattern = pickPattern( cachedPatterns ?? [], inferred );

	const page = ( await apiFetch( {
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			title: pattern?.title ?? inferred.brand_name ?? 'New page',
			content: pattern?.html ?? '',
			status: 'draft',
		},
	} ) ) as CreatedPage;

	return {
		page_id: page.id,
		edit_url: '/wp-admin/post.php?post=' + page.id + '&action=edit',
	};
}
