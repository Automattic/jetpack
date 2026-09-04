import { useCallback, useState } from '@wordpress/element';
import { useAnalytics } from '../../hooks/use-analytics';
import { useFileContents } from '../../hooks/use-file-contents';
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
 * The one filename whose preview waits for a deliberate second click:
 * `wp-config.php`, which carries `DB_PASSWORD` and the salts. Same single
 * file Calypso hides, so the two surfaces agree.
 */
const SENSITIVE_NAME = 'wp-config.php';

/**
 * Whether the given manifest path names the file above, at any depth.
 *
 * Three ways to fail open, all closed: the volume prefix is dropped (the `5`
 * in `f5:` is a data-type code, not identity), the compare is lowercased, and
 * the name matches at any depth, so a second install under `/staging/` is
 * covered. The `/` in the suffix keeps `mywp-config.php` out.
 *
 * @param manifestPath - The volume-prefixed manifest path, e.g. `f5:/wp-config.php`.
 * @return True when the preview needs a reveal.
 */
function isSensitivePath( manifestPath: string | undefined ): boolean {
	if ( ! manifestPath ) {
		return false;
	}
	const path = manifestPath.slice( manifestPath.indexOf( ':' ) + 1 ).toLowerCase();
	return path === SENSITIVE_NAME || path.endsWith( `/${ SENSITIVE_NAME }` );
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
	// Withholding the fetch too, not just the `<pre>`: unrevealed secrets never
	// reach the browser at all.
	const awaitingReveal = Boolean( mimeType ) && isSensitivePath( file.manifestPath ) && ! revealed;
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

	return {
		mimeType,
		size,
		hash,
		modified: lastModified ?? file.lastModified,
		awaitingReveal,
		showPreview,
		reveal,
		content,
		isText,
		truncated,
		contentsLoading,
		contentsError,
	};
}
