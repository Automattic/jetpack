import { useCopyToClipboard } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { check, copy } from '@wordpress/icons';
import { IconButton, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import type { FailureReference, ReferenceId } from '../../types/failure-reference';

const COPIED_FOR_MS = 3000;

/**
 * One labelled part per id kind, each its own literal so every msgid is extractable.
 *
 * @param id - The id and what it identifies.
 * @return The labelled id.
 */
function formatId( id: ReferenceId ): string {
	const value = String( id.value );
	switch ( id.kind ) {
		case 'restore':
			/* translators: %s: identifier of a restore, quoted to support. */
			return sprintf( __( 'Restore ID: %s', 'jetpack-backup-pkg' ), value );
		case 'download':
			/* translators: %s: identifier of a download, quoted to support. */
			return sprintf( __( 'Download ID: %s', 'jetpack-backup-pkg' ), value );
		case 'attempt':
			/* translators: %s: identifier of a failed backup attempt, quoted to support. */
			return sprintf( __( 'Backup attempt ID: %s', 'jetpack-backup-pkg' ), value );
		default:
			/* translators: %s: identifier of a backup, quoted to support. */
			return sprintf( __( 'Backup ID: %s', 'jetpack-backup-pkg' ), value );
	}
}

/**
 * The reference as one line, which is also exactly what the button copies.
 *
 * @param reference - The failure's code and id.
 * @return The line, or an empty string when there is nothing to quote.
 */
export function formatReference( reference: FailureReference ): string {
	const parts: string[] = [];
	if ( reference.code ) {
		/* translators: %s: machine-readable error code, quoted to support. */
		parts.push( sprintf( __( 'Error code: %s', 'jetpack-backup-pkg' ), reference.code ) );
	}
	if ( reference.id ) {
		parts.push( formatId( reference.id ) );
	}
	return parts.join( ' · ' );
}

/**
 * A line under an error naming what support needs to look it up, with a copy button.
 *
 * @param reference - The failure's code and id.
 * @return The line, or null when there is nothing to quote.
 */
export default function ErrorReference( reference: FailureReference ) {
	const text = formatReference( reference );
	const [ copied, setCopied ] = useState( false );
	// Falls back to `execCommand` where `navigator.clipboard` is missing, as on plain-HTTP sites.
	const ref = useCopyToClipboard< HTMLButtonElement >( text, () => setCopied( true ) );

	useEffect( () => {
		if ( ! copied ) {
			return;
		}
		const timer = setTimeout( () => setCopied( false ), COPIED_FOR_MS );
		return () => clearTimeout( timer );
	}, [ copied ] );

	if ( ! text ) {
		return null;
	}

	return (
		<Stack className="jpb-error-reference" direction="row" align="center" gap="xs">
			<Text variant="body-sm" className="jpb-text-muted">
				{ text }
			</Text>
			<IconButton
				ref={ ref }
				label={
					copied
						? __( 'Copied', 'jetpack-backup-pkg' )
						: __( 'Copy error reference', 'jetpack-backup-pkg' )
				}
				icon={ copied ? check : copy }
				variant="minimal"
				tone="neutral"
				size="small"
			/>
			{ /* Mounted empty so it exists before it has anything to say. */ }
			<VisuallyHidden role="status">
				{ copied ? __( 'Copied', 'jetpack-backup-pkg' ) : '' }
			</VisuallyHidden>
		</Stack>
	);
}
