import type { TailoredInferred } from './types.ts';

/**
 * Stream F replaces this body with the PTK pattern fetch + POST /wp/v2/pages.
 *
 * @param inferred - The AI-inferred site details.
 * @return The created page id and its editor URL.
 */
export async function createPatternPage(
	inferred: TailoredInferred // eslint-disable-line @typescript-eslint/no-unused-vars
): Promise< { page_id: number; edit_url: string } > {
	return { page_id: 0, edit_url: '' };
}
