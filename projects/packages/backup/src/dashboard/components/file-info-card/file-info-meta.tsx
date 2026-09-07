import { dateI18n } from '@wordpress/date';
import { __ } from '@wordpress/i18n';
import { formatFileSize } from '../../hooks/use-path-info';

/**
 * The open file's modified date, size, type and hash, as a definition list.
 * Each row is omitted when its fetch has not resolved or does not apply.
 *
 * @param props          - Component props.
 * @param props.modified - Modification timestamp, absent while unresolved.
 * @param props.size     - Size in bytes, absent while unresolved.
 * @param props.mimeType - Mime type, or `''` when the file is not previewable.
 * @param props.hash     - Content hash, absent while unresolved.
 * @return The rendered definition list.
 */
export default function FileInfoMeta( {
	modified,
	size,
	mimeType,
	hash,
}: {
	modified: string | null | undefined;
	size: number | null;
	mimeType: string;
	hash: string | null | undefined;
} ) {
	// `dir` on a span, not the `<dd>`: isolating the value there would flip the
	// row's `text-align: start` inside an RTL panel.
	return (
		<dl className="jpb-file-info__meta">
			{ modified && (
				<div>
					<dt>{ __( 'Modified:', 'jetpack-backup-pkg' ) }</dt>
					<dd>{ dateI18n( 'M j, Y, g:i A', modified, undefined ) }</dd>
				</div>
			) }
			{ size !== null && (
				<div>
					<dt>{ __( 'Size:', 'jetpack-backup-pkg' ) }</dt>
					<dd>
						<span dir="auto">{ formatFileSize( size ) }</span>
					</dd>
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
					<dd className="jpb-file-info__hash">
						<span dir="ltr">{ hash }</span>
					</dd>
				</div>
			) }
		</dl>
	);
}
