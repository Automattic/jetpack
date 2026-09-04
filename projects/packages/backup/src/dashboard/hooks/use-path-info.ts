import { useQuery } from '@tanstack/react-query';
import { _x, sprintf } from '@wordpress/i18n';
import { fetchPathInfo } from '../data/api/path-info';
import { keys } from '../data/query-client';
import type { PathInfoResponse } from '../data/api/path-info';

export type FileDetails = {
	size: number | null;
	hash: string | null;
	lastModified: string | null;
};

const NO_DETAILS: FileDetails = { size: null, hash: null, lastModified: null };

/**
 * Project WPCOM's path-info payload onto what the info card renders.
 *
 * Upstream reports a missing file as HTTP 200 with an `error` string
 * rather than a 4xx, so the body has to be inspected: taking it at face
 * value would render `0 bytes` and an empty hash as if they were real
 * measurements.
 *
 * `mtime` needs a stricter guard than a bare `Number()` coercion, which
 * turns `null`, `''` and `false` into `0` — a perfectly valid Date of
 * 1 Jan 1970 whose ISO string is *truthy*. That would win the card's
 * `lastModified ?? file.lastModified` fallback and show 1970 for a file
 * whose real date was already known from `/ls`. Only a positive number
 * is a usable mtime.
 *
 * The resulting `Date` is then checked as well as the number, the way
 * `toFileNode` checks `period`: `Date` is only defined within ±8.64e15
 * ms, so a microsecond-scale timestamp is finite and still throws
 * `RangeError` from `toISOString()` on the render path.
 *
 * That pair does not catch every scale error, and deliberately so — a
 * millisecond-scale mtime stays inside range and renders as year 57390.
 * Nothing distinguishes it from a genuine far-future timestamp, so it
 * is left alone rather than guessed at.
 *
 * @param raw - The raw payload, or undefined before the query resolves.
 * @return Normalized details, with nulls wherever a value is unusable.
 */
export function toFileDetails( raw: PathInfoResponse | undefined ): FileDetails {
	if ( ! raw || raw.error ) {
		return NO_DETAILS;
	}

	const mtime = typeof raw.mtime === 'number' && raw.mtime > 0 ? raw.mtime : null;
	const mtimeDate = mtime === null ? null : new Date( mtime * 1000 );
	const lastModified =
		mtimeDate && ! Number.isNaN( mtimeDate.getTime() ) ? mtimeDate.toISOString() : null;

	// `size` arrives as a decimal string, and a bare `Number()` would turn
	// `null` or `''` into a real-looking `0` — a zero-byte file is genuine.
	const rawSize = raw.size;
	const byteCount =
		typeof rawSize === 'number' || ( typeof rawSize === 'string' && rawSize.trim() !== '' )
			? Number( rawSize )
			: NaN;

	return {
		size: Number.isFinite( byteCount ) ? byteCount : null,
		hash: raw.hash ? raw.hash : null,
		lastModified,
	};
}

/**
 * Render a byte count for display, one decimal place at most.
 *
 * Backed-up files run from empty to multi-gigabyte archives, so a raw
 * byte count is unreadable at the top of that range. Whole numbers stay
 * whole — `1 KB`, not `1.0 KB`.
 *
 * Each unit gets a whole translatable string rather than a shared
 * `%1$s %2$s` joiner. A two-placeholder msgid tells a translator
 * nothing about what is being formatted, and locales that lead with the
 * unit have no way to reorder it.
 *
 * The strings are also translated per call rather than hoisted to a
 * module constant: this dashboard's boot downloads its translation
 * catalogs asynchronously, so anything translated at import time
 * resolves before the catalog lands and freezes the English in for the
 * life of the page.
 *
 * @param bytes - Size in bytes.
 * @return A localized, human-readable size.
 */
export function formatFileSize( bytes: number ): string {
	const LARGEST_UNIT = 3;
	let value = bytes;
	let unit = 0;
	while ( value >= 1024 && unit < LARGEST_UNIT ) {
		value /= 1024;
		unit++;
	}

	const rounded = String( Math.round( value * 10 ) / 10 );

	switch ( unit ) {
		case 1:
			return sprintf(
				/* translators: %s: a file size number, e.g. "3.2". */
				_x( '%s KB', 'file size in kilobytes', 'jetpack-backup-pkg' ),
				rounded
			);
		case 2:
			return sprintf(
				/* translators: %s: a file size number, e.g. "3.2". */
				_x( '%s MB', 'file size in megabytes', 'jetpack-backup-pkg' ),
				rounded
			);
		case LARGEST_UNIT:
			return sprintf(
				/* translators: %s: a file size number, e.g. "3.2". */
				_x( '%s GB', 'file size in gigabytes', 'jetpack-backup-pkg' ),
				rounded
			);
		default:
			return sprintf(
				/* translators: %s: a file size number, e.g. "512". */
				_x( '%s B', 'file size in bytes', 'jetpack-backup-pkg' ),
				rounded
			);
	}
}

/**
 * Hook reading one file's recorded size, hash and modification time.
 *
 * Kept separate from the file tree because `/ls` carries neither size
 * nor hash, and its `period` is the snapshot the file landed in rather
 * than the file's own mtime.
 *
 * @param filePeriod   - The file's own snapshot timestamp (from /ls `period`).
 * @param manifestPath - The volume-prefixed manifest path (from /ls `manifest_path`), sent unencoded.
 * @param enabled      - When false, the query is skipped.
 * @return Normalized details plus loading state.
 */
export function usePathInfo(
	filePeriod: string | undefined,
	manifestPath: string | undefined,
	enabled = true
): FileDetails & { isLoading: boolean } {
	const safePeriod = filePeriod ?? '';
	const safePath = manifestPath ?? '';
	const query = useQuery( {
		queryKey: keys.pathInfo( safePeriod, safePath ),
		queryFn: () => fetchPathInfo( safePeriod, safePath ),
		enabled: enabled && Boolean( safePeriod ) && Boolean( safePath ),
	} );

	return { ...toFileDetails( query.data ), isLoading: query.isLoading };
}
