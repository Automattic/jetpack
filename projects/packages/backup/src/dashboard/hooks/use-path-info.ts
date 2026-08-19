import { useQuery } from '@tanstack/react-query';
import { __, _x, sprintf } from '@wordpress/i18n';
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
 * `mtime` gets the same treatment `toFileNode` gives `period`. It is
 * unvalidated upstream data, and `toISOString()` throws `RangeError` on
 * an unrepresentable date from inside the render path. Testing the
 * resulting `Date` rather than the number is what makes the guard
 * complete — `Number.isFinite` passes anything in float range, while
 * `Date` is only defined within ±8.64e15 ms, so an mtime that arrives
 * in milliseconds is finite and still unrepresentable.
 *
 * @param raw - The raw payload, or undefined before the query resolves.
 * @return Normalized details, with nulls wherever a value is unusable.
 */
export function toFileDetails( raw: PathInfoResponse | undefined ): FileDetails {
	if ( ! raw || raw.error ) {
		return NO_DETAILS;
	}

	const mtimeDate = new Date( Number( raw.mtime ) * 1000 );
	const lastModified = Number.isNaN( mtimeDate.getTime() ) ? null : mtimeDate.toISOString();

	return {
		size: typeof raw.size === 'number' ? raw.size : null,
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
 * The unit list is built per call rather than hoisted to a module
 * constant on purpose: this dashboard's boot downloads its translation
 * catalogs asynchronously, so anything translated at import time
 * resolves before the catalog lands and freezes the English string in
 * for the life of the page.
 *
 * @param bytes - Size in bytes.
 * @return A localized, human-readable size.
 */
export function formatFileSize( bytes: number ): string {
	const units = [
		_x( 'B', 'abbreviation for bytes, a unit of file size', 'jetpack-backup-pkg' ),
		_x( 'KB', 'abbreviation for kilobytes, a unit of file size', 'jetpack-backup-pkg' ),
		_x( 'MB', 'abbreviation for megabytes, a unit of file size', 'jetpack-backup-pkg' ),
		_x( 'GB', 'abbreviation for gigabytes, a unit of file size', 'jetpack-backup-pkg' ),
	];

	let value = bytes;
	let unit = 0;
	while ( value >= 1024 && unit < units.length - 1 ) {
		value /= 1024;
		unit++;
	}

	const rounded = Math.round( value * 10 ) / 10;
	return sprintf(
		/* translators: 1: A file size number, e.g. "3.2". 2: An abbreviated unit of file size, e.g. "KB". */
		__( '%1$s %2$s', 'jetpack-backup-pkg' ),
		String( rounded ),
		units[ unit ]
	);
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
