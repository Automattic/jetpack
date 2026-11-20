/**
 * Internal dependencies
 */
import { isVideoPressGuid, pickGUIDFromUrl } from '../../../lib/url';
/**
 * Types
 */
import type { PlaylistEntry } from './types';

/**
 * Resolve raw user input (a VideoPress URL or a bare GUID) to a GUID.
 *
 * @param input - Raw user input.
 * @return The GUID, or null when the input isn't a VideoPress video reference.
 */
export function guidFromInput( input: string ): string | null {
	const value = input.trim();
	if ( ! value ) {
		return null;
	}

	if ( isVideoPressGuid( value ) ) {
		return value;
	}

	return pickGUIDFromUrl( value );
}

/**
 * Build a stored playlist entry from a videos API response item. Only the
 * numeric metadata is stored; title and poster stay live-only.
 *
 * @param guid - The video GUID.
 * @param item - The videos API response.
 * @return Playlist entry with the metadata the API reported.
 */
export function entryFromApiResponse(
	guid: string,
	item: Record< string, unknown >
): PlaylistEntry {
	const entry: PlaylistEntry = { guid };

	// The API isn't strict about numeric types, so coerce rather than type-check.
	const duration = Number( item?.duration );
	if ( Number.isFinite( duration ) && duration > 0 ) {
		entry.durationMs = duration;
	}
	const height = Number( item?.height );
	if ( Number.isFinite( height ) && height > 0 ) {
		entry.height = height;
	}

	return entry;
}
