import { selectFallback } from './fallback.ts';
import type { TailorResult, WizardInput } from './types.ts';

/**
 * Stream F replaces this body with the real jetpack-ai-query call. The stub
 * resolves through the deterministic fallback path.
 */
export async function tailor( input: WizardInput ): Promise< TailorResult > {
	return {
		source: 'fallback',
		output: selectFallback( input ),
	};
}
