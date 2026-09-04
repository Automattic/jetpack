import { useCallback, useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import FileInfoMeta from './file-info-meta';
import PreviewBody from './preview-body';
import useFileInfo from './use-file-info';
import './style.scss';
import type { FileNodeFile } from '../../types/file-tree';

type Props = {
	file: FileNodeFile;
	onClose: () => void;
};

/**
 * Side panel showing details for the currently-open file: size, hash,
 * modified timestamp, and a monospace text preview for recognized text
 * mime types.
 *
 * The column chrome for a panel wide enough to hold it. `<FileInfoDialog>` is
 * the same content for a panel that is not.
 *
 * @param props         - Component props.
 * @param props.file    - The file node clicked in the tree.
 * @param props.onClose - Callback to close the card.
 * @return The rendered info card.
 */
export default function FileInfoCard( { file, onClose }: Props ) {
	const previewRef = useRef< HTMLDivElement >( null );
	const {
		mimeType,
		size,
		hash,
		modified,
		awaitingReveal,
		showPreview,
		reveal,
		content,
		isText,
		truncated,
		contentsLoading,
		contentsError,
	} = useFileInfo( file );

	const handleReveal = useCallback( () => {
		reveal();
		// The click unmounts the button holding focus. Same contract the close
		// button keeps in `file-browser/index.tsx`: move focus, hand it back.
		previewRef.current?.focus();
	}, [ reveal ] );

	// Opening a file mounts this card in the tree's sibling column. Without a
	// focus move a keyboard reader has to tab through every remaining row to
	// reach it, and a screen-reader reader is told nothing happened at all.
	//
	// The preview region is the target rather than the card, because it is
	// the content the reader asked for, it is already a tab stop, and it is
	// a plain element here — focusing the card would mean threading a ref
	// through `Card.Root`. Close stays one Shift+Tab away.
	//
	// Keyed on `manifestPath` so switching between files re-announces, while
	// a re-render for any other reason does not steal focus back.
	useEffect( () => {
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
					{ /* A filename is LTR data even on an RTL page. */ }
					<span dir="ltr">{ file.name }</span>
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
			<FileInfoMeta modified={ modified } size={ size } mimeType={ mimeType } hash={ hash } />
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
					onReveal={ handleReveal }
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
