import { Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { useFileContents } from '../../hooks/use-file-contents';
import './style.scss';
import type { FileNodeFile } from '../../types/file-tree';

/**
 * Heuristic mime-type lookup by file extension.
 *
 * WPCOM's `/path-info` endpoint, which PR 48859 originally relied on,
 * returns "No file found" for every variant we tried — it appears to
 * query an internal index that isn't populated for every site / file.
 * Deriving mime from the extension keeps the FileInfoCard's preview-or-
 * not decision working without that fetch, and matches the heuristic
 * legacy file managers use.
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
 * contents in a `<pre>` when available, or a "preview unavailable" muted
 * line when the mime type isn't text or the fetch returned nothing.
 *
 * Pulled out as a standalone component to keep `FileInfoCard`'s JSX flat
 * (no nested ternaries) and to give the loading / error / empty branches
 * unique render paths the linter can reason about.
 *
 * @param props             - Component props.
 * @param props.showPreview - Whether the file's mime type is renderable as text.
 * @param props.isLoading   - Whether the file-contents query is in flight.
 * @param props.content     - The fetched body, or null when not yet resolved.
 * @return The preview body.
 */
function PreviewBody( {
	showPreview,
	isLoading,
	content,
}: {
	showPreview: boolean;
	isLoading: boolean;
	content: string | null;
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
 * Side panel showing details for the currently-open file: modified
 * timestamp, monospace text preview for recognized text mime types,
 * plus per-file Download and Restore buttons.
 *
 * `lastModified`, `period`, and `manifestPath` all come from `/ls` and
 * are carried on the FileNode itself — no extra fetch needed. The
 * preview pulls content via the file's own `period` (not the parent
 * backup's rewindId) because VaultPress addresses file blobs by their
 * per-entry snapshot timestamp.
 *
 * @param props         - Component props.
 * @param props.file    - The file node clicked in the tree.
 * @param props.onClose - Callback to close the card.
 * @return The rendered info card.
 */
export default function FileInfoCard( { file, onClose }: Props ) {
	const mimeType = mimeFromName( file.name );
	const showPreview = mimeType ? isTextual( mimeType ) : false;
	const { content, isLoading: contentsLoading } = useFileContents(
		file.period,
		file.manifestPath,
		showPreview
	);

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
				{ file.lastModified && (
					<div>
						<dt>{ __( 'Modified:', 'jetpack-backup-pkg' ) }</dt>
						<dd>{ dateI18n( 'M j, Y, g:i A', file.lastModified, undefined ) }</dd>
					</div>
				) }
				{ mimeType && (
					<div>
						<dt>{ __( 'Type:', 'jetpack-backup-pkg' ) }</dt>
						<dd>{ mimeType }</dd>
					</div>
				) }
			</dl>
			<div className="jpb-file-info-card__preview">
				<PreviewBody
					showPreview={ showPreview }
					isLoading={ contentsLoading }
					content={ content }
				/>
			</div>
			<Stack
				direction="row"
				align="center"
				justify="flex-end"
				gap="sm"
				className="jpb-file-info-card__actions"
			>
				<Button
					variant="outline"
					tone="neutral"
					size="small"
					aria-label={ sprintf(
						/* translators: %s file name */
						__( 'Download %s', 'jetpack-backup-pkg' ),
						file.name
					) }
				>
					{ __( 'Download file', 'jetpack-backup-pkg' ) }
				</Button>
				<Button variant="solid" tone="brand" size="small">
					{ __( 'Restore', 'jetpack-backup-pkg' ) }
				</Button>
			</Stack>
		</Card.Root>
	);
}
