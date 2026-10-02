import { useEffect, useRef } from '@wordpress/element';
import { commitTailoring, type PreparedTailoring } from './commit-tailoring.ts';
import { prepareTailoring, tailor } from './tailor.ts';
import type { SiteCopy, TailorResult, WizardInput } from './types.ts';

const PREWARM_DELAY_MS = 1_500;

interface PrewarmCache {
	key: string;
	promise: Promise< PreparedTailoring | null >;
}

let cache: PrewarmCache | null = null;

/**
 * Whether the partial wizard input has every field needed to tailor.
 *
 * @param state - The partial wizard input.
 * @return True when the input is complete.
 */
function isComplete( state: Partial< WizardInput > ): state is WizardInput {
	return (
		!! state.goal &&
		typeof state.site_name === 'string' &&
		!! state.description &&
		!! state.locale &&
		!! state.ui_locale
	);
}

/**
 * Stable cache key for a wizard input.
 *
 * @param input - The wizard input.
 * @return The cache key.
 */
function cacheKey( input: WizardInput ): string {
	return JSON.stringify( [
		input.goal,
		input.site_name,
		input.description,
		input.locale,
		input.ui_locale,
	] );
}

/**
 * Start a background tailoring for the input and cache its promise, unless an
 * identical one is already cached. Prepared only: a speculative run writes
 * nothing, so the wizard the user abandons leaves no tailored list behind.
 *
 * @param input - The wizard input.
 * @param copy  - The site-language copy for the fallback drafts.
 */
function startPrewarm( input: WizardInput, copy: SiteCopy ): void {
	const key = cacheKey( input );
	if ( cache && cache.key === key ) {
		return;
	}
	cache = {
		key,
		// Swallow rejections so the background fire never surfaces an unhandled rejection; the Finish handler handles errors on its own await.
		promise: prepareTailoring( input, copy ).catch( () => null ),
	};
}

/**
 * Background-fire the tailoring while the user fills in the wizard, caching its
 * promise for `getPrewarmedTailor` to commit.
 *
 * @param state - The partial wizard input collected so far.
 * @param copy  - The site-language copy for the fallback drafts.
 */
export function usePrewarm( state: Partial< WizardInput >, copy: SiteCopy ): void {
	const timer = useRef< ReturnType< typeof setTimeout > >( undefined );

	// Depend on the stable cache key, not the `state` object, which is fresh every render and would re-arm the debounce on every re-render.
	const input = isComplete( state ) ? state : null;
	const key = input ? cacheKey( input ) : '';

	useEffect( () => {
		if ( ! input ) {
			return;
		}
		timer.current = setTimeout( () => startPrewarm( input, copy ), PREWARM_DELAY_MS );
		return () => clearTimeout( timer.current );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ key ] );
}

/**
 * Commit the prewarmed tailoring for this input if one is in flight or settled,
 * otherwise run a fresh one. Either way the output is written exactly once, here.
 *
 * @param input - The collected wizard input.
 * @param copy  - The site-language copy for the fallback drafts.
 * @return The tailored result.
 */
export function getPrewarmedTailor( input: WizardInput, copy: SiteCopy ): Promise< TailorResult > {
	const key = cacheKey( input );
	if ( cache && cache.key === key ) {
		return cache.promise.then( prepared =>
			prepared ? commitTailoring( prepared, input, copy ) : tailor( input, copy )
		);
	}
	return tailor( input, copy );
}
