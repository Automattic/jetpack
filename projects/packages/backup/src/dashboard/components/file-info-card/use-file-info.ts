import { useCallback, useState } from '@wordpress/element';
import { useAnalytics } from '../../hooks/use-analytics';
import { useFileContents } from '../../hooks/use-file-contents';
import { useFileDownload } from '../../hooks/use-file-download';
import { usePathInfo } from '../../hooks/use-path-info';
import type { FileNodeFile } from '../../types/file-tree';

/**
 * File extensions this card can render as text, and the mime type it
 * labels each one with.
 *
 * Membership is the whole previewability rule — an extension in this map
 * previews, one outside it does not. Adding a binary format here to get
 * a `Type:` row would therefore also send its bytes to the `<pre>`, so
 * keep binaries out. `.svg` earns its place because the card shows the
 * source rather than rendering the image, which also keeps a hostile SVG
 * out of the DOM.
 *
 * Deliberately not replaced by `path-info`'s `data_type`: that field is
 * a small integer type code — the manifest path's second character —
 * rather than a mime type, and it cannot tell a previewable `.php` from
 * an opaque binary. Calypso reaches the same conclusion and keeps its
 * own extension map for exactly this decision, using `data_type` only
 * to drive granular download.
 *
 * `sql` and `log` never preview unprompted despite being here: every
 * pattern below matches them, so they arrive behind the reveal click.
 */
const PREVIEWABLE_TEXT_TYPES: Record< string, string > = {
	css: 'text/css',
	csv: 'text/csv',
	htm: 'text/html',
	html: 'text/html',
	js: 'application/javascript',
	json: 'application/json',
	log: 'text/plain',
	md: 'text/markdown',
	php: 'application/x-php',
	po: 'text/plain',
	pot: 'text/plain',
	sql: 'application/sql',
	svg: 'image/svg+xml',
	txt: 'text/plain',
	xml: 'application/xml',
	yaml: 'text/yaml',
	yml: 'text/yaml',
};

/**
 * Derive a mime type from the given filename's extension. Returns an
 * empty string when the extension isn't recognized, in which case the
 * card falls back to the "preview unavailable" branch.
 *
 * @param name - Filename, e.g. `wp-config.php`.
 * @return The matched mime type, or `''`.
 */
function mimeFromName( name: string ): string {
	const idx = name.lastIndexOf( '.' );
	if ( idx <= 0 || idx === name.length - 1 ) {
		return '';
	}
	const ext = name.slice( idx + 1 ).toLowerCase();
	// Not `?? ''`: the map is an object literal, so `a.__proto__` and
	// `a.constructor` resolve through the prototype chain to values that are
	// neither null nor undefined. They would preview, and the non-string would
	// reach `<dd>{ mimeType }</dd>` and throw "Objects are not valid as a React
	// child", taking the panel down instead of showing "Preview unavailable".
	const mime = PREVIEWABLE_TEXT_TYPES[ ext ];
	return typeof mime === 'string' ? mime : '';
}

/**
 * Files whose preview waits for a deliberate second click: anything that can
 * hold credentials, plus any hand-made copy of one that still previews.
 *
 * Matched against the lowercased, prefix-stripped manifest path. The trailing
 * `[^/]*$` keeps a match inside one filename; `config/application` is the only
 * pattern that also pins a parent directory.
 */
const SENSITIVE_PATH_PATTERNS: readonly RegExp[] = [
	/(^|\/)wp-config[^/]*$/,
	/(^|\/)config\/application[^/]*$/,
	/\.env[^/]*$/,
	/\.log[^/]*$/,
	/\.sql[^/]*$/,
];

/**
 * Whether the manifest path is a database table dump (`dd:wp_users`).
 *
 * @param manifestPath - The volume-prefixed manifest path.
 * @return True for a `dd:` path.
 */
function isTableDump( manifestPath: string | undefined ): boolean {
	return Boolean( manifestPath?.toLowerCase().startsWith( 'dd:' ) );
}

/**
 * Whether the given manifest path matches one of the patterns above.
 *
 * The `5` in `f5:` is a data-type code, not identity, so the prefix goes.
 * The one exception is `dd:`, the code of every database table dump under `sql/`
 * (`dd:wp_users`): those names carry no extension and hold password hashes.
 *
 * @param manifestPath - The volume-prefixed manifest path, e.g. `f5:/wp-config.php`.
 * @return True when the preview needs a reveal.
 */
function isSensitivePath( manifestPath: string | undefined ): boolean {
	if ( ! manifestPath ) {
		return false;
	}
	if ( isTableDump( manifestPath ) ) {
		return true;
	}
	const path = manifestPath.slice( manifestPath.indexOf( ':' ) + 1 ).toLowerCase();
	return SENSITIVE_PATH_PATTERNS.some( pattern => pattern.test( path ) );
}

/**
 * Everything a file-info chrome needs about the open file: the two fetches,
 * the previewability decision, and the reveal gate for sensitive files.
 *
 * Both fetches key on the file's own `period`, not the backup's rewindId:
 * VaultPress rows are per file version. `mtime` beats `/ls`'s snapshot date.
 *
 * @param file - The file node clicked in the tree.
 * @return Metadata, preview state, and the reveal callback.
 */
export default function useFileInfo( file: FileNodeFile ) {
	const mimeType = mimeFromName( file.name );
	const { tracks } = useAnalytics();
	const previewId = `${ file.period }:${ file.manifestPath }`;
	const [ revealedFor, setRevealedFor ] = useState< string | null >( null );
	const [ lastPreviewId, setLastPreviewId ] = useState( previewId );
	// Cleared during render, not in an effect: `useFileContents` below commits
	// its query on this same render, so a reveal left over from the previous
	// file would have fetched the next one's bytes before an effect could run.
	if ( lastPreviewId !== previewId ) {
		setLastPreviewId( previewId );
		setRevealedFor( null );
	}
	const revealed = revealedFor === previewId;
	// From the path alone: a secret with no previewable extension (`.env`, `.sql.gz`)
	// still waits for the click. Also withholds the fetch, not just the `<pre>`.
	const awaitingReveal = isSensitivePath( file.manifestPath ) && ! revealed;
	const showPreview = Boolean( mimeType ) && ! awaitingReveal;
	const reveal = useCallback( () => {
		setRevealedFor( previewId );
		tracks.recordEvent( 'jetpack_backup_browser_preview_file_sensitive_click' );
	}, [ previewId, tracks ] );
	const {
		content,
		isText,
		truncated,
		isLoading: contentsLoading,
		error: contentsError,
	} = useFileContents( file.period, file.manifestPath, showPreview );
	const { size, hash, lastModified } = usePathInfo( file.period, file.manifestPath );
	const fileDownload = useFileDownload( file.period, file.manifestPath );

	return {
		mimeType,
		size,
		hash,
		modified: lastModified ?? file.lastModified,
		awaitingReveal,
		previewable: Boolean( mimeType ),
		showPreview,
		reveal,
		content,
		isText,
		truncated,
		contentsLoading,
		contentsError,
		// Same reveal rule as the preview. The route itself does not enforce it.
		// Table dumps need a granular download job, which is not implemented.
		canDownload: fileDownload.canDownload && ! awaitingReveal && ! isTableDump( file.manifestPath ),
		download: fileDownload.download,
		isDownloading: fileDownload.isDownloading,
		downloadFailed: fileDownload.downloadFailed,
	};
}
