import { Spinner, VisuallyHidden } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, closeSmall, unseen } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { useAnalytics } from '../../hooks/use-analytics';
import { useFileContents } from '../../hooks/use-file-contents';
import { formatFileSize, usePathInfo } from '../../hooks/use-path-info';
import './style.scss';
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
 * The one file whose preview waits for a deliberate second click: the
 * site's root `wp-config.php`, which carries `DB_PASSWORD` and the salts.
 * Same single file Calypso hides, so the two surfaces agree.
 */
const SENSITIVE_PATH = '/wp-config.php';

/**
 * Whether the given manifest path names the file above.
 *
 * Compared after the volume prefix, and a path without one is compared
 * whole: the `5` in `f5:` is VaultPress's data-type code rather than part
 * of the file's identity, so matching on it would let the gate fail open.
 *
 * @param manifestPath - The volume-prefixed manifest path, e.g. `f5:/wp-config.php`.
 * @return True when the preview needs a reveal.
 */
function isSensitivePath( manifestPath: string | undefined ): boolean {
	if ( ! manifestPath ) {
		return false;
	}
	return manifestPath.slice( manifestPath.indexOf( ':' ) + 1 ) === SENSITIVE_PATH;
}

type Props = {
	file: FileNodeFile;
	onClose: () => void;
};

/**
 * Renders the preview slot's body: a spinner while loading, the file
 * contents in a `<pre>`, or a muted line when there is nothing to show.
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
function PreviewBody( {
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
		// `Spinner` is `role="presentation"` with no text, so on its own this
		// branch is silent — and focus lands here while it is still showing.
		// Without something to read, the region announces itself and then says
		// nothing at all.
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
			{ /* Above the `<pre>`, not after: the panel is the scroll container, so
			     a note below is reachable only past the content it warns about. */ }
			{ truncated && (
				<Text
					variant="body-sm"
					className="jpb-text-muted jpb-file-info-card__preview-note"
					render={ <p /> }
				>
					{ __(
						'Preview truncated: this file is too large to show in full.',
						'jetpack-backup-pkg'
					) }
				</Text>
			) }
			<pre>{ content }</pre>
		</>
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
	const { tracks } = useAnalytics();
	const [ revealed, setRevealed ] = useState( false );
	// Withholding the fetch too, not just the `<pre>`: unrevealed secrets never
	// reach the browser at all.
	const awaitingReveal = Boolean( mimeType ) && isSensitivePath( file.manifestPath ) && ! revealed;
	const showPreview = Boolean( mimeType ) && ! awaitingReveal;
	const reveal = useCallback( () => {
		setRevealed( true );
		tracks.recordEvent( 'jetpack_backup_browser_preview_file_sensitive_click' );
	}, [ tracks ] );
	const {
		content,
		isText,
		truncated,
		isLoading: contentsLoading,
		error: contentsError,
	} = useFileContents( file.period, file.manifestPath, showPreview );
	const { size, hash, lastModified } = usePathInfo( file.period, file.manifestPath );
	const modified = lastModified ?? file.lastModified;

	// Opening a file mounts this card somewhere else entirely — it is the
	// second column of a grid as tall as the tree, so on a scrolled tree it
	// lands well above the row that was clicked. Without a focus move a
	// keyboard reader has to tab through every remaining row to reach it,
	// and a screen-reader reader is told nothing happened at all.
	//
	// The preview region is the target rather than the card, because it is
	// the content the reader asked for, it is already a tab stop, and it is
	// a plain element here — focusing the card would mean threading a ref
	// through `Card.Root`. Close stays one Shift+Tab away.
	//
	// Keyed on `manifestPath` so switching between files re-announces, while
	// a re-render for any other reason does not steal focus back.
	const previewRef = useRef< HTMLDivElement >( null );
	useEffect( () => {
		// Reset here too: the card is not remounted per file, so without this a
		// return visit to `wp-config.php` would print it with no second click.
		setRevealed( false );
		previewRef.current?.focus();
	}, [ file.manifestPath ] );

	return (
		<Card.Root className="jpb-file-info-card">
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				className="jpb-file-info-card__header"
			>
				<Text variant="heading-sm" render={ <h3 /> }>
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
			{ /*
			 * A scroll container (`max-height: 320px; overflow: auto`) that
			 * nothing can put focus in cannot be scrolled by keyboard at all —
			 * the only focusable thing in this card is Close. `tabIndex={ 0 }`
			 * makes it a stop; `role="region"` plus a name is what stops that
			 * stop being an unlabelled mystery when it is reached.
			 */ }
			<div
				ref={ previewRef }
				className="jpb-file-info-card__preview"
				tabIndex={ 0 }
				role="region"
				aria-busy={ contentsLoading }
				aria-label={ sprintf(
					/* translators: %s: file name. */
					__( 'Preview of %s', 'jetpack-backup-pkg' ),
					file.name
				) }
			>
				<PreviewBody
					awaitingReveal={ awaitingReveal }
					onReveal={ reveal }
					showPreview={ showPreview }
					isLoading={ contentsLoading }
					content={ content }
					isText={ isText }
					truncated={ truncated }
					error={ contentsError }
				/>
			</div>
		</Card.Root>
	);
}
