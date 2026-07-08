import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { findContents } from '../../fixtures/file-contents';
import './style.scss';
import type { FileNodeFile } from '../../types/file-tree';

type Props = {
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
 * Side panel showing details for the currently-open file: size, modified
 * timestamp, hash, monospace text preview for recognized text mime types,
 * plus per-file Download and Restore buttons.
 *
 * @param props         - Component props.
 * @param props.file    - The file to render.
 * @param props.onClose - Callback to close the card.
 * @return The rendered info card.
 */
export default function FileInfoCard( { file, onClose }: Props ) {
	const contents = isTextual( file.mimeType ) ? findContents( file.path ) : null;

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
				<div>
					<dt>{ __( 'Size:', 'jetpack-backup-pkg' ) }</dt>
					<dd>{ humanSize( file.sizeBytes ) }</dd>
				</div>
				<div>
					<dt>{ __( 'Modified:', 'jetpack-backup-pkg' ) }</dt>
					<dd>{ dateI18n( 'M j, Y, g:i A', file.lastModified, undefined ) }</dd>
				</div>
				<div>
					<dt>{ __( 'Hash:', 'jetpack-backup-pkg' ) }</dt>
					<dd className="jpb-file-info-card__hash">{ file.hash }</dd>
				</div>
			</dl>
			<div className="jpb-file-info-card__preview">
				{ contents !== null ? (
					<pre>{ contents }</pre>
				) : (
					<Text variant="body-sm" className="jpb-text-muted">
						{ __( 'Preview unavailable for this file.', 'jetpack-backup-pkg' ) }
					</Text>
				) }
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
