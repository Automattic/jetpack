import { Spinner, VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, unseen } from '@wordpress/icons';
import { Button, Stack, Text } from '@wordpress/ui';

/**
 * Renders the preview slot's body: a spinner while loading, the file
 * contents in a `<pre>`, or a muted line when there is nothing to show.
 *
 * The error branch names no cause on purpose: no failure mode here is
 * specific enough to blame.
 *
 * @param props                - Component props.
 * @param props.awaitingReveal - Whether the file holds secrets the reader has not asked for yet.
 * @param props.onReveal       - Called when the reader asks for the hidden preview.
 * @param props.showPreview    - Whether the filename's extension is in the previewable map.
 * @param props.isLoading      - Whether the file-contents query is in flight.
 * @param props.content        - The fetched body, or null when not yet resolved.
 * @param props.isText         - Whether the bridge could read the fetched bytes as text.
 * @param props.truncated      - Whether the body stops at the bridge's preview cap.
 * @param props.error          - The fetch error, or null on success.
 * @return The preview body.
 */
export default function PreviewBody( {
	awaitingReveal,
	onReveal,
	showPreview,
	isLoading,
	content,
	isText,
	truncated,
	error,
}: {
	awaitingReveal: boolean;
	onReveal: () => void;
	showPreview: boolean;
	isLoading: boolean;
	content: string | null;
	isText: boolean;
	truncated: boolean;
	error: Error | null;
} ) {
	// Ahead of `showPreview`, which the gate holds false until the reveal.
	if ( awaitingReveal ) {
		return (
			<Stack direction="column" align="center" gap="xs">
				<Icon icon={ unseen } />
				<Text variant="body-sm" render={ <p /> }>
					{ __(
						'This preview is hidden because it contains sensitive information.',
						'jetpack-backup-pkg'
					) }
				</Text>
				<Button variant="outline" size="compact" onClick={ onReveal }>
					{ __( 'Show preview', 'jetpack-backup-pkg' ) }
				</Button>
			</Stack>
		);
	}
	if ( ! showPreview ) {
		return (
			<Text variant="body-sm" className="jpb-text-muted">
				{ __( 'Preview unavailable for this file.', 'jetpack-backup-pkg' ) }
			</Text>
		);
	}
	if ( isLoading ) {
		// `Spinner` is `role="presentation"` with no text, so focus landing here
		// would announce the region and then say nothing at all.
		return (
			<>
				<Spinner />
				<VisuallyHidden>{ __( 'Loading preview…', 'jetpack-backup-pkg' ) }</VisuallyHidden>
			</>
		);
	}
	if ( error ) {
		return (
			<Text variant="body-sm" className="jpb-text-muted">
				{ __( 'Preview could not be loaded for this file.', 'jetpack-backup-pkg' ) }
			</Text>
		);
	}
	// Deliberately not the unpreviewable-extension wording: the extension said
	// this file was previewable, and the bytes turned out not to be text.
	if ( ! isText ) {
		return (
			<Text variant="body-sm" className="jpb-text-muted">
				{ __( 'This file is not text and cannot be previewed.', 'jetpack-backup-pkg' ) }
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
	return (
		<>
			{ /* Above the `<pre>`, not after: the region is the scroll container, so
			     a note below is reachable only past the content it warns about. */ }
			{ truncated && (
				<Text variant="body-sm" className="jpb-text-muted jpb-file-info__note" render={ <p /> }>
					{ __(
						'Preview truncated: this file is too large to show in full.',
						'jetpack-backup-pkg'
					) }
				</Text>
			) }
			{ /* `ltr`, not `auto`: source stays LTR even when it opens with an RTL string literal. */ }
			<pre className="jpb-file-info__code" dir="ltr">
				{ content }
			</pre>
		</>
	);
}
