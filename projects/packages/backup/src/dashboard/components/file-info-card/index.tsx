import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { useFileContents } from '../../hooks/use-file-contents';
import { usePathInfo } from '../../hooks/use-path-info';
import './style.scss';
import type { FileNodeFile } from '../../types/file-tree';

type Props = {
	rewindId: string;
	file: FileNodeFile;
	onClose: () => void;
};

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
 * Formats a byte count as a short human-readable string.
 *
 * @param bytes - Size in bytes.
 * @return Formatted size (e.g. `4.7 KB`).
 */
function humanSize( bytes: number ): string {
	if ( bytes < 1024 ) {
		return `${ bytes } B`;
	}
	if ( bytes < 1024 * 1024 ) {
		return `${ ( bytes / 1024 ).toFixed( 1 ) } KB`;
	}
	return `${ ( bytes / 1024 / 1024 ).toFixed( 1 ) } MB`;
}

/**
 * Side panel showing details for the currently-open file: name + path +
 * size + mime, plus a monospace preview for recognized text mime types.
 *
 * @param props          - Component props.
 * @param props.rewindId - Backup rewind id, threaded into the file-contents fetcher.
 * @param props.file     - The file to render.
 * @param props.onClose  - Callback to close the card.
 * @return The rendered info card.
 */
export default function FileInfoCard( { rewindId, file, onClose }: Props ) {
	// The tree response only carries names + types — `mime_type` and `size`
	// come from path-info, which we fetch once per opened file.
	const { data: pathInfo, isLoading: pathInfoLoading } = usePathInfo( rewindId, file.path );
	const mimeType = pathInfo?.mime_type ?? file.mimeType;
	const sizeBytes = pathInfo?.size ?? file.sizeBytes;
	const canPreview = ! pathInfoLoading && isTextual( mimeType );
	const { content: contents } = useFileContents( rewindId, file.path, canPreview );

	return (
		<Card className="jpb-file-info-card">
			<Stack direction="row" align="center" justify="space-between">
				<Text variant="heading-sm" render={ <h4 /> }>
					{ file.name }
				</Text>
				<Button
					variant="tertiary"
					aria-label={ __( 'Close preview', 'jetpack-backup-pkg' ) }
					icon={ <Icon icon={ closeSmall } /> }
					onClick={ onClose }
				/>
			</Stack>
			<Stack direction="column" gap="2xs">
				<Text size="small" variant="muted">
					{ file.path }
				</Text>
				<Text size="small" variant="muted">
					{ humanSize( sizeBytes ) } { mimeType }
				</Text>
			</Stack>
			<div className="jpb-file-info-card__preview">
				{ contents !== null ? (
					<pre>{ contents }</pre>
				) : (
					<Text size="small" variant="muted">
						{ canPreview
							? __( 'Loading preview…', 'jetpack-backup-pkg' )
							: __( 'No preview available for this file type.', 'jetpack-backup-pkg' ) }
					</Text>
				) }
			</div>
		</Card>
	);
}
