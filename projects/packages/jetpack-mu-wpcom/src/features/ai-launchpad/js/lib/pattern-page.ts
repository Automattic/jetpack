import apiFetch from '@wordpress/api-fetch';
import type { TailoredInferred } from './types.ts';

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

export type PatternVariant = 'about' | 'gallery';

const VARIANT_CONFIG: Record< PatternVariant, { category: string | null; markerMeta: string } > = {
	about: { category: null, markerMeta: '_wpcom_ai_launchpad_about_page' },
	gallery: { category: 'gallery', markerMeta: '_wpcom_ai_launchpad_gallery_page' },
};

// An empty core/gallery block, used when the pattern library yields no gallery pattern. The class list mirrors
// what the gallery block serializes (including the default flex layout) so the editor doesn't flag invalid markup.
const GALLERY_FALLBACK_HTML =
	'<!-- wp:gallery {"linkTo":"none"} --><figure class="wp-block-gallery has-nested-images columns-default is-cropped is-layout-flex wp-block-gallery-is-layout-flex"></figure><!-- /wp:gallery -->';

/**
 * Tokenize the inferred niche/vibe/audience into lowercase match words. Goal is
 * excluded: it describes intent, not topic, so it adds noise.
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
 * Count how many match words appear in a pattern's title, category titles, or
 * tag titles.
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
 * Choose the page title, block content, and marker meta for a pattern-page variant.
 *
 * The gallery variant filters the library to the `gallery` category before niche scoring and falls back to a bare
 * gallery block so the page always contains a gallery. The about variant is unfiltered (current behaviour).
 *
 * @param patterns - The fetched patterns.
 * @param inferred - The AI-inferred site details.
 * @param variant  - The pattern-page variant.
 * @return The title, content HTML, and marker meta key.
 */
export function selectPatternPage(
	patterns: PtkPattern[],
	inferred: TailoredInferred,
	variant: PatternVariant
): { title: string; content: string; markerMeta: string } {
	const config = VARIANT_CONFIG[ variant ];
	const pool =
		config.category === null
			? patterns
			: patterns.filter( pattern =>
					termTitles( pattern.categories ).some( title =>
						title.toLowerCase().includes( config.category as string )
					)
			  );
	const pattern = pickPattern( pool, inferred );
	const fallback = variant === 'gallery' ? GALLERY_FALLBACK_HTML : '';
	// The gallery page gets a fixed title; the pattern's own name ("Gallery: Two columns…") is not a useful title.
	// Left untranslated on purpose: it's a placeholder on the created draft that the user renames before
	// publishing (like WordPress core's English "Auto Draft"), not a piece of shipped UI copy.
	const title =
		variant === 'gallery' ? 'Gallery' : pattern?.title ?? inferred.brand_name ?? 'New page';
	const rawContent = pattern?.html ?? fallback;
	return {
		title,
		// Drop any in-pattern heading that just repeats the title, so the gallery page doesn't show "Gallery" twice.
		content: variant === 'gallery' ? stripHeadingMatching( rawContent, title ) : rawContent,
		markerMeta: config.markerMeta,
	};
}

// Cache the parsed PTK library in module scope; stays null on a failed fetch so a later click can retry.
let cachedPatterns: PtkPattern[] | null = null;

/**
 * Fetch the English pattern library, pick a pattern matching the inferred niche,
 * and create a draft page from it.
 *
 * @param inferred - The AI-inferred site details.
 * @param variant  - The pattern-page variant.
 * @return The created page id and its editor URL.
 */
export async function createPatternPage(
	inferred: TailoredInferred,
	variant: PatternVariant = 'about'
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
			// Network/parse failure: leave the cache unset so a later click retries; the page is still created below.
		}
	}

	const { title, content, markerMeta } = selectPatternPage(
		cachedPatterns ?? [],
		inferred,
		variant
	);

	const page = ( await apiFetch( {
		path: '/wp/v2/pages',
		method: 'POST',
		data: {
			title,
			content,
			status: 'draft',
			// Tag as the AI Launchpad page so the server-side listener can complete the task on publish.
			meta: { [ markerMeta ]: true },
		},
	} ) ) as CreatedPage;

	return {
		page_id: page.id,
		edit_url: '/wp-admin/post.php?post=' + page.id + '&action=edit',
	};
}
