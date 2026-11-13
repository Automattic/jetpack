import { reloadPage } from './reload-page';

const ATTEMPT_KEY = 'jetpack-premium-analytics-chunk-retry';
const ATTEMPT_WINDOW_MS = 60_000;

// Each browser words a failed dynamic import differently, and webpack has a name of its own.
const CHUNK_LOAD =
	/failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|ChunkLoadError/i;

/**
 * Whether a thrown value is a module that failed to load.
 *
 * @param message - The error message.
 * @param name    - The error name, if any.
 * @return Whether it is a chunk load failure.
 */
export function isChunkLoadError( message: string, name?: string ): boolean {
	return CHUNK_LOAD.test( message ) || CHUNK_LOAD.test( name ?? '' );
}

/**
 * Reloads the page so it asks for the modules of the build now deployed, at most once a minute.
 *
 * The attempt is recorded per tab, so a tab left open across a deploy recovers whether or not
 * another tab has already reloaded, and the record is never part of a URL the reader can share.
 */
export function recoverFromChunkLoad(): void {
	let attempted: string | null;

	try {
		attempted = window.sessionStorage.getItem( ATTEMPT_KEY );
	} catch {
		// A reload nothing records would reload again on the next failure, and loop.
		return;
	}

	const now = Date.now();
	const last = Number( attempted );
	if ( now - last < ATTEMPT_WINDOW_MS ) {
		return;
	}

	try {
		window.sessionStorage.setItem( ATTEMPT_KEY, String( now ) );
	} catch {
		return;
	}

	reloadPage();
}
