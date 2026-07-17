import apiFetch from '@wordpress/api-fetch';
import { logContentTailored } from './content-log.ts';
import type { TailoredInferred } from './types.ts';

/**
 * Gallery-page creation from the PTK pattern library. Only the gallery task uses patterns —
 * its content is images; the About page writes AI-drafted content instead (about-page.ts).
 */

const PTK_ENDPOINT = 'https://public-api.wordpress.com/rest/v1/ptk/patterns/en';

interface PtkTaxonomyTerm {
	title?: string;
	slug?: string;
}

// PTK returns taxonomies as a slug-keyed map, or `[]` when empty, so both shapes must be handled.
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

// An empty core/gallery block, used when the pattern library yields no gallery pattern. The class list mirrors
// what the gallery block serializes (including the default flex layout) so the editor doesn't flag invalid markup.
const GALLERY_FALLBACK_HTML =
	'<!-- wp:gallery {"linkTo":"none"} --><figure class="wp-block-gallery has-nested-images columns-default is-cropped is-layout-flex wp-block-gallery-is-layout-flex"></figure><!-- /wp:gallery -->';

// Connective words that survive the length filter and would otherwise dominate scoring.
const STOP_WORDS = new Set( [ 'and', 'the', 'for', 'with', 'from', 'your', 'our' ] );

/**
 * Tokenize the inferred niche/vibe/audience into deduplicated lowercase match words.
 * Goal is excluded: it describes intent, not topic.
 *
 * @param inferred - The AI-inferred site details.
 * @return The match words.
 */
function nicheWords( inferred: TailoredInferred ): string[] {
	const words = [ inferred.niche, inferred.vibe, inferred.audience ]
		.filter( ( value ): value is string => typeof value === 'string' && value.length > 0 )
		.join( ' ' )
		.toLowerCase()
		.split( /[^a-z0-9]+/ )
		.filter( word => word.length > 2 && ! STOP_WORDS.has( word ) );
	return [ ...new Set( words ) ];
}

/**
 * Extract the human-readable term titles from a PTK taxonomy.
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
 * Count how many match words appear as whole tokens in a pattern's title, category titles,
 * or tag titles (whole tokens, so "art" cannot match "Smart").
 *
 * @param pattern - The candidate pattern.
 * @param words   - The niche match words.
 * @return The match score.
 */
function score( pattern: PtkPattern, words: string[] ): number {
	const haystack = new Set(
		[ pattern.title ?? '', ...termTitles( pattern.categories ), ...termTitles( pattern.tags ) ]
			.join( ' ' )
			.toLowerCase()
			.split( /[^a-z0-9]+/ )
	);
	return words.reduce( ( total, word ) => ( haystack.has( word ) ? total + 1 : total ), 0 );
}

/**
 * Pick the pattern best matching the given niche words, falling back to the first
 * pattern with usable HTML when nothing scores.
 *
 * @param patterns - The fetched patterns.
 * @param words    - The niche match words.
 * @return The chosen pattern (null when none have HTML) and its match score.
 */
export function pickPattern(
	patterns: PtkPattern[],
	words: string[]
): { pattern: PtkPattern | null; score: number } {
	const usable = patterns.filter( pattern => typeof pattern.html === 'string' && pattern.html );
	if ( usable.length === 0 ) {
		return { pattern: null, score: 0 };
	}
	let best = usable[ 0 ];
	let bestScore = score( best, words );
	for ( const pattern of usable.slice( 1 ) ) {
		const current = score( pattern, words );
		if ( current > bestScore ) {
			best = pattern;
			bestScore = current;
		}
	}
	return { pattern: best, score: bestScore };
}

/**
 * Remove heading blocks whose visible text just repeats the page title, so a page
 * with a separately-set title doesn't show that word again as an in-content heading.
 *
 * @param html  - The pattern block markup.
 * @param title - The page title to de-duplicate against.
 * @return The markup with matching heading blocks removed.
 */
function stripHeadingMatching( html: string, title: string ): string {
	const target = title.trim().toLowerCase();
	return html.replace( /<!-- wp:heading\b[^]*?<!-- \/wp:heading -->\s*/g, block => {
		const text = block
			.replace( /<[^>]*>/g, '' )
			.trim()
			.toLowerCase();
		return text === target ? '' : block;
	} );
}

/**
 * How the pattern selection went, for the `content_tailored` event. `fallback`: `none` = a
 * pattern matched the niche words, `first_usable` = nothing scored so the pick is arbitrary,
 * `empty` = no usable pattern, so the bare gallery block was used.
 */
export interface GallerySelectionLog {
	pool_size: number;
	match_words: string[];
	picked_title: string | null;
	picked_score: number;
	fallback: 'none' | 'first_usable' | 'empty';
}

/**
 * Choose the gallery page's title and block content: the library is filtered to the `gallery`
 * category before niche scoring, with a bare gallery block as the fallback.
 *
 * @param patterns - The fetched patterns.
 * @param inferred - The AI-inferred site details.
 * @return The title, content HTML, and the selection log fields.
 */
export function selectGalleryPage(
	patterns: PtkPattern[],
	inferred: TailoredInferred
): { title: string; content: string; log: GallerySelectionLog } {
	const pool = patterns.filter( pattern =>
		termTitles( pattern.categories ).some( title => title.toLowerCase().includes( 'gallery' ) )
	);
	const words = nicheWords( inferred );
	const { pattern, score: pickedScore } = pickPattern( pool, words );

	let fallback: GallerySelectionLog[ 'fallback' ] = 'none';
	if ( pattern === null ) {
		fallback = 'empty';
	} else if ( pickedScore === 0 ) {
		fallback = 'first_usable';
	}

	// Fixed, untranslated placeholder title (like core's "Auto Draft"); the pattern's own name
	// ("Gallery: Two columns…") is not a useful title.
	const title = 'Gallery';
	const rawContent = pattern?.html ?? GALLERY_FALLBACK_HTML;

	return {
		title,
		content: stripHeadingMatching( rawContent, title ),
		log: {
			pool_size: pool.length,
			match_words: words,
			picked_title: pattern?.title ?? null,
			picked_score: pickedScore,
			fallback,
		},
	};
}

// Cache the parsed PTK library in module scope; stays null on a failed fetch so a later click can retry.
let cachedPatterns: PtkPattern[] | null = null;

/**
 * Fetch the English pattern library, pick a gallery pattern matching the inferred
 * niche, and create a draft page from it.
 *
 * @param inferred - The AI-inferred site details.
 * @return The created page id and its editor URL.
 */
export async function createGalleryPage(
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
			// Leave the cache unset so a later click retries; the page is still created below.
		}
	}

	const { title, content, log } = selectGalleryPage( cachedPatterns ?? [], inferred );

	const page = ( await apiFetch( {
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			title,
			content,
			status: 'draft',
			// Tag as the AI Launchpad page so the server-side listener can complete the task on publish.
			meta: { _wpcom_ai_launchpad_gallery_page: true },
		},
	} ) ) as CreatedPage;

	logContentTailored( () => ( {
		page_id: page.id,
		// null = the library was unavailable.
		library_size: cachedPatterns?.length ?? null,
		...log,
	} ) );

	return {
		page_id: page.id,
		edit_url: '/wp-admin/post.php?post=' + page.id + '&action=edit',
	};
}
