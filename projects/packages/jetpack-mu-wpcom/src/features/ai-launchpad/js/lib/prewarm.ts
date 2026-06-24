import { useEffect, useRef } from '@wordpress/element';
import { tailor } from './tailor.ts';
import type { TailorResult, WizardInput } from './types.ts';

const PREWARM_DELAY_MS = 1_500;

interface PrewarmCache {
	key: string;
	promise: Promise< TailorResult >;
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
		!! state.goal && typeof state.site_name === 'string' && !! state.description && !! state.locale
	);
}

/**
 * Stable cache key for a wizard input.
 *
 * @param input - The wizard input.
 * @return The cache key.
 */
function cacheKey( input: WizardInput ): string {
	return JSON.stringify( [ input.goal, input.site_name, input.description, input.locale ] );
}

/**
 * Start a background tailor call for the input and cache its promise, unless an
 * identical call is already cached.
 *
 * @param input - The wizard input.
 */
function startPrewarm( input: WizardInput ): void {
	const key = cacheKey( input );
	if ( cache && cache.key === key ) {
		return;
	}
	cache = {
		key,
		// The prewarmed call persists on its own; a settled-but-unread promise
		// is harmless. Swallow rejections here so the background fire never
		// surfaces an unhandled rejection; the Finish handler awaits its own
		// result and handles errors there.
		promise: tailor( input ).catch( () => null as unknown as TailorResult ),
	};
}

/**
 * Background-fire the tailor call while the user fills in the wizard. After
 * PREWARM_DELAY_MS of idle (no further state changes), the call starts and its
 * promise is cached in module scope keyed by the input. The Finish handler can
 * reuse it via `getPrewarmedTailor`.
 *
 * @param state - The partial wizard input collected so far.
 */
export function usePrewarm( state: Partial< WizardInput > ): void {
	const timer = useRef< ReturnType< typeof setTimeout > >();

	// Depend on the stable cache key, not the `state` object: the call site passes
	// a fresh object every render, so keying on identity would clear and re-arm the
	// debounce on every unrelated re-render, eroding the head start it exists for.
	const input = isComplete( state ) ? state : null;
	const key = input ? cacheKey( input ) : '';

	useEffect( () => {
		if ( ! input ) {
			return;
		}
		timer.current = setTimeout( () => startPrewarm( input ), PREWARM_DELAY_MS );
		return () => clearTimeout( timer.current );
		// `key` is the stable identity of `input`; depending on `input` itself
		// would defeat the point.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ key ] );
}

/**
 * Return the prewarmed tailor promise for this input if one is in flight or
 * settled, otherwise start a fresh tailor call. Lets the Finish handler reuse
 * the head start from `usePrewarm`.
 *
 * @param input - The collected wizard input.
 * @return The tailored result.
 */
export function getPrewarmedTailor( input: WizardInput ): Promise< TailorResult > {
	const key = cacheKey( input );
	if ( cache && cache.key === key ) {
		return cache.promise.then( result => result ?? tailor( input ) );
	}
	return tailor( input );
}
