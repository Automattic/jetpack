import { selectFallback } from './fallback.ts';
import type { TailorResult, WizardInput } from './types.ts';

/**
 * Stream F replaces this body with the real jetpack-ai-query call. The stub
 * resolves through the deterministic fallback path.
 *
 * @param input - The collected wizard input.
 * @return The tailored result, sourced from the fallback path in the stub.
 */
export async function tailor( input: WizardInput ): Promise< TailorResult > {
	return {
		source: 'fallback',
		output: selectFallback( input ),
	};
}
