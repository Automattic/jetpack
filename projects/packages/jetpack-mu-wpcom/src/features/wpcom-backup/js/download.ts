/**
 * Every category a download can include, keyed as WordPress.com's rewind API names them.
 */
export const ALL_ITEMS = {
	themes: true,
	plugins: true,
	roots: true,
	contents: true,
	sqls: true,
	uploads: true,
};

export type DownloadItems = typeof ALL_ITEMS;

/** The backup a reverted site can still download. */
export type LastBackup = {
	/** Sent back to the API exactly as it arrived. */
	rewindId: string;
	/** When the backup was taken, in milliseconds. */
	takenAt: number;
};

/** One download, as far as WordPress.com has got with it. */
export type Download =
	| { status: 'running'; id: number; progress: number }
	| { status: 'finished'; id: number; url: string; size: string }
	| { status: 'failed'; id: number; error: string }
	| { status: 'expired'; id: number };

type RawDownload = {
	downloadId?: unknown;
	rewindId?: unknown;
	progress?: unknown;
	url?: unknown;
	validUntil?: unknown;
	bytesFormatted?: unknown;
	error?: unknown;
};

/**
 * Whether the checklist names at least one category.
 *
 * Never send an empty selection: WordPress.com reads a `types` that names nothing as every category.
 *
 * @param items - The checklist.
 * @return True when at least one category is selected.
 */
export function hasSelectedItems( items: DownloadItems ): boolean {
	return Object.values( items ).some( Boolean );
}

/**
 * The newest successful backup in a `wpcom/v3` `rewind/backups` response, which lists newest first.
 *
 * @param response - The response body.
 * @return The backup, or null when there is none to offer.
 */
export function pickLastBackup( response: unknown ): LastBackup | null {
	const backups = ( response as { backups?: unknown } | null )?.backups;

	if ( ! Array.isArray( backups ) ) {
		return null;
	}

	for ( const backup of backups ) {
		const period: unknown = backup?.object?.backup_period;
		const seconds = Number( period );

		if (
			backup?.is_rewindable === true &&
			( typeof period === 'string' || typeof period === 'number' ) &&
			seconds > 0
		) {
			return { rewindId: String( period ), takenAt: seconds * 1000 };
		}
	}

	return null;
}

/**
 * Read one download from WordPress.com's rewind API.
 *
 * The payload has no status field, so status is read from which keys have arrived.
 *
 * @param raw - One download from the API.
 * @return The download, or null when the payload names none.
 */
export function readDownload( raw: unknown ): Download | null {
	const download = ( raw ?? {} ) as RawDownload;
	const id = Number( download.downloadId );

	if ( ! Number.isInteger( id ) || id <= 0 ) {
		return null;
	}

	// Checked first: a failed download can still carry the URL of an earlier attempt.
	if ( download.error ) {
		return {
			status: 'failed',
			id,
			error: typeof download.error === 'string' ? download.error : '',
		};
	}

	if ( typeof download.url === 'string' && download.url !== '' ) {
		// The URL becomes a link, and React does not strip a `javascript:` one.
		return isWebUrl( download.url )
			? {
					status: 'finished',
					id,
					url: download.url,
					size: typeof download.bytesFormatted === 'string' ? download.bytesFormatted : '',
				}
			: { status: 'failed', id, error: '' };
	}

	// A finished download keeps its expiry after the link itself is withdrawn.
	if ( download.validUntil ) {
		return { status: 'expired', id };
	}

	const progress = Number( download.progress );

	return {
		status: 'running',
		id,
		progress: Number.isFinite( progress ) ? Math.min( 100, Math.max( 0, progress ) ) : 0,
	};
}

/**
 * The newest download of a backup that is still worth showing.
 *
 * @param response - The `rewind/downloads` list.
 * @param rewindId - The backup on offer.
 * @return The download if it is still being built or can be fetched, otherwise null.
 */
export function findResumableDownload( response: unknown, rewindId: string ): Download | null {
	if ( ! Array.isArray( response ) ) {
		return null;
	}

	let newest: Download | null = null;

	for ( const raw of response ) {
		const download = isOfBackup( raw, rewindId ) ? readDownload( raw ) : null;

		if ( download && ( ! newest || download.id > newest.id ) ) {
			newest = download;
		}
	}

	return newest?.status === 'running' || newest?.status === 'finished' ? newest : null;
}

/**
 * The download a create request started.
 *
 * While one download runs, the API answers every create request with that job, whichever backup it is of.
 *
 * @param response - The `rewind/downloads` POST response.
 * @param rewindId - The backup that was asked for.
 * @return The download ID, `busy` when the job belongs to another backup, or null when none was named.
 */
export function readCreatedDownload( response: unknown, rewindId: string ): number | 'busy' | null {
	const id = Number( ( response as RawDownload | null )?.downloadId );

	if ( ! Number.isInteger( id ) || id <= 0 ) {
		return null;
	}

	const echoed = ( response as RawDownload ).rewindId;

	return echoed === undefined || isOfBackup( response, rewindId ) ? id : 'busy';
}

/**
 * Whether a download belongs to a backup, however its rewind ID was encoded.
 *
 * @param raw      - One download from the API.
 * @param rewindId - The backup's rewind ID.
 * @return True when the IDs match as strings or as numbers.
 */
function isOfBackup( raw: unknown, rewindId: string ): boolean {
	const echoed = ( raw as RawDownload | null )?.rewindId;

	return String( echoed ) === rewindId || Number( echoed ) === Number( rewindId );
}

/**
 * Whether a URL is one a browser may follow as a plain link.
 *
 * @param url - The URL.
 * @return True for an http or https URL.
 */
function isWebUrl( url: string ): boolean {
	try {
		const { protocol } = new URL( url );
		return protocol === 'https:' || protocol === 'http:';
	} catch {
		return false;
	}
}
