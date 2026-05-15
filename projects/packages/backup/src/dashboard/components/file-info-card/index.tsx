import { __ } from '@wordpress/i18n';
import { Icon, closeSmall } from '@wordpress/icons';
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
 * Side panel showing details for the currently-open file: name + path +
 * size + mime, plus a monospace preview for recognized text mime types.
 *
 * @param props         - Component props.
 * @param props.file    - The file to render.
 * @param props.onClose - Callback to close the card.
 * @return The rendered info card.
 */
export default function FileInfoCard( { file, onClose }: Props ) {
	const contents = isTextual( file.mimeType ) ? findContents( file.path ) : null;

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
					{ humanSize( file.sizeBytes ) } { file.mimeType }
				</Text>
			</Stack>
			<div className="jpb-file-info-card__preview">
				{ contents !== null ? (
					<pre>{ contents }</pre>
				) : (
					<Text size="small" variant="muted">
						{ __( 'No preview available for this file type.', 'jetpack-backup-pkg' ) }
					</Text>
				) }
			</div>
		</Card>
	);
}
