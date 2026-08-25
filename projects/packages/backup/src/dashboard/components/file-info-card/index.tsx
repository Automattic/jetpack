import { Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { useFileContents } from '../../hooks/use-file-contents';
import { formatFileSize, usePathInfo } from '../../hooks/use-path-info';
import './style.scss';
import type { FileNodeFile } from '../../types/file-tree';

/**
 * Heuristic mime-type lookup by file extension.
 *
 * Deliberately not replaced by `path-info`'s `data_type`: that field is
 * a small integer type code — the manifest path's second character —
 * rather than a mime type, and it cannot tell a previewable `.php` from
 * an opaque binary. Calypso reaches the same conclusion and keeps its
 * own extension map for exactly this decision, using `data_type` only
 * to drive granular download.
 */
const EXT_TO_MIME: Record< string, string > = {
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
	return EXT_TO_MIME[ ext ] ?? '';
}

type Props = {
	file: FileNodeFile;
	onClose: () => void;
};

/**
 * Renders the preview slot's body: a spinner while loading, the file
 * contents in a `<pre>` when available, a muted line when the fetch
 * failed, or a generic "preview unavailable" muted line for non-text
 * mime types.
 *
 * The error branch says nothing about *why*, on purpose. It used to
 * blame blob storage having outlived the manifest entry, which was
 * never right: upstream reports a genuinely unreadable blob with a
 * different error entirely, and the failure that prompted that wording
 * turned out to be this package percent-encoding an already-base64
 * path. There is no failure mode here specific enough to name.
 *
 * Pulled out as a standalone component to keep `FileInfoCard`'s JSX flat
 * (no nested ternaries) and to give the loading / error / empty branches
 * unique render paths the linter can reason about.
 *
 * @param props             - Component props.
 * @param props.showPreview - Whether the file's mime type is renderable as text.
 * @param props.isLoading   - Whether the file-contents query is in flight.
 * @param props.content     - The fetched body, or null when not yet resolved.
 * @param props.error       - The fetch error, or null on success.
 * @return The preview body.
 */
function PreviewBody( {
	showPreview,
	isLoading,
	content,
	error,
}: {
	showPreview: boolean;
	isLoading: boolean;
	content: string | null;
	error: Error | null;
} ) {
	if ( ! showPreview ) {
		return (
			<Text variant="body-sm" className="jpb-text-muted">
				{ __( 'Preview unavailable for this file.', 'jetpack-backup-pkg' ) }
			</Text>
		);
	}
	if ( isLoading ) {
		return <Spinner />;
	}
	if ( error ) {
		return (
			<Text variant="body-sm" className="jpb-text-muted">
				{ __( 'Preview could not be loaded for this file.', 'jetpack-backup-pkg' ) }
			</Text>
		);
	}
	if ( content === null ) {
		return (
			<Text variant="body-sm" className="jpb-text-muted">
				{ __( 'Preview unavailable for this file.', 'jetpack-backup-pkg' ) }
			</Text>
		);
	}
	return <pre>{ content }</pre>;
}

/**
 * Returns true when the given mime type is renderable as plain text.
 *
 * @param mime - Mime type string.
 * @return Whether the type is textual.
 */
function isTextual( mime: string ): boolean {
	return (
		mime.startsWith( 'text/' ) ||
		mime === 'application/x-php' ||
		mime === 'application/sql' ||
		mime === 'application/json'
	);
}

/**
 * Side panel showing details for the currently-open file: size, hash,
 * modified timestamp, and a monospace text preview for recognized text
 * mime types.
 *
 * Two fetches back this, both keyed on the file's own `period` from
 * `/ls` rather than the parent backup's rewindId, because VaultPress
 * records one row per file version and matches the period exactly.
 * `path-info` supplies size, hash and the real mtime; `file-content`
 * supplies the preview body. Neither is fatal on its own — the card
 * renders whatever resolved.
 *
 * `lastModified` from `/ls` is the snapshot the file landed in, which
 * is close to but not the same as the file's modification time, so
 * path-info's `mtime` wins when it is available.
 *
 * @param props         - Component props.
 * @param props.file    - The file node clicked in the tree.
 * @param props.onClose - Callback to close the card.
 * @return The rendered info card.
 */
export default function FileInfoCard( { file, onClose }: Props ) {
	const mimeType = mimeFromName( file.name );
	const showPreview = mimeType ? isTextual( mimeType ) : false;
	const {
		content,
		isLoading: contentsLoading,
		error: contentsError,
	} = useFileContents( file.period, file.manifestPath, showPreview );
	const { size, hash, lastModified } = usePathInfo( file.period, file.manifestPath );
	const modified = lastModified ?? file.lastModified;

	return (
		<Card.Root className="jpb-file-info-card">
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className="jpb-file-info-card__header"
			>
				<Text variant="heading-sm" render={ <h4 /> }>
					{ file.name }
				</Text>
				<Button
					variant="minimal"
					tone="neutral"
					size="small"
					aria-label={ __( 'Close preview', 'jetpack-backup-pkg' ) }
					onClick={ onClose }
				>
					<Button.Icon icon={ closeSmall } />
				</Button>
			</Stack>
			<dl className="jpb-file-info-card__meta">
				{ modified && (
					<div>
						<dt>{ __( 'Modified:', 'jetpack-backup-pkg' ) }</dt>
						<dd>{ dateI18n( 'M j, Y, g:i A', modified, undefined ) }</dd>
					</div>
				) }
				{ size !== null && (
					<div>
						<dt>{ __( 'Size:', 'jetpack-backup-pkg' ) }</dt>
						<dd>{ formatFileSize( size ) }</dd>
					</div>
				) }
				{ mimeType && (
					<div>
						<dt>{ __( 'Type:', 'jetpack-backup-pkg' ) }</dt>
						<dd>{ mimeType }</dd>
					</div>
				) }
				{ hash && (
					<div>
						<dt>{ __( 'Hash:', 'jetpack-backup-pkg' ) }</dt>
						<dd className="jpb-file-info-card__hash">{ hash }</dd>
					</div>
				) }
			</dl>
			<div className="jpb-file-info-card__preview">
				<PreviewBody
					showPreview={ showPreview }
					isLoading={ contentsLoading }
					content={ content }
					error={ contentsError }
				/>
			</div>
		</Card.Root>
	);
}
