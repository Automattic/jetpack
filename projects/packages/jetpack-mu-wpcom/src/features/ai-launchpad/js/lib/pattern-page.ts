import apiFetch from '@wordpress/api-fetch';
import type { TailoredInferred } from './types.ts';

const PTK_ENDPOINT = 'https://public-api.wordpress.com/rest/v1/ptk/patterns/en';

interface PtkPattern {
	title?: string;
	html?: string;
	categories?: Record< string, unknown >;
	tags?: Record< string, unknown >;
}

interface CreatedPage {
	id: number;
}

/**
 * Tokenize the inferred niche/goal/vibe/audience into lowercase match words.
 *
 * @param inferred - The AI-inferred site details.
 * @return The match words.
 */
function nicheWords( inferred: TailoredInferred ): string[] {
	return [ inferred.niche, inferred.goal, inferred.vibe, inferred.audience ]
		.filter( ( value ): value is string => typeof value === 'string' && value.length > 0 )
		.join( ' ' )
		.toLowerCase()
		.split( /[^a-z0-9]+/ )
		.filter( word => word.length > 2 );
}

/**
 * Count how many match words appear in a pattern's title, categories, or tags.
 *
 * @param pattern - The candidate pattern.
 * @param words   - The niche match words.
 * @return The match score.
 */
function score( pattern: PtkPattern, words: string[] ): number {
	const haystack = [
		pattern.title ?? '',
		...Object.keys( pattern.categories ?? {} ),
		...Object.keys( pattern.tags ?? {} ),
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
function pickPattern( patterns: PtkPattern[], inferred: TailoredInferred ): PtkPattern | null {
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
	const patterns = ( await ( await fetch( PTK_ENDPOINT ) ).json() ) as PtkPattern[];
	const pattern = pickPattern( patterns, inferred );

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
