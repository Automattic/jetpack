import { useCallback, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Dialog } from '@wordpress/ui';
import useAdminMenuWidth from '../../hooks/use-admin-menu-width';
import FileInfoMeta from '../file-info-card/file-info-meta';
import PreviewBody from '../file-info-card/preview-body';
import useFileInfo from '../file-info-card/use-file-info';
import '../file-info-card/style.scss';
import './style.scss';
import type { FileNodeFile } from '../../types/file-tree';
import type { CSSProperties } from 'react';

type Props = {
	file: FileNodeFile;
	onClose: () => void;
};

/**
 * Details for the currently-open file, as a modal.
 *
 * Used where the panel is too narrow to hold `<FileInfoCard>` beside the tree,
 * and sized against the viewport instead. `Dialog` restores focus on close, so
 * nothing here mirrors `<FileInfoCard>`'s `openerRef` dance.
 *
 * @param props         - Component props.
 * @param props.file    - The file node clicked in the tree.
 * @param props.onClose - Callback to close the dialog.
 * @return The rendered dialog.
 */
export default function FileInfoDialog( { file, onClose }: Props ) {
	const previewRef = useRef< HTMLDivElement >( null );
	const adminMenuWidth = useAdminMenuWidth();
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
		// The click unmounts the button holding focus; `Dialog.Content` is the
		// nearest thing that survives it.
		previewRef.current?.focus();
	}, [ reveal ] );

	const handleOpenChange = useCallback(
		( open: boolean ) => {
			if ( ! open ) {
				onClose();
			}
		},
		[ onClose ]
	);

	return (
		<Dialog.Root open onOpenChange={ handleOpenChange }>
			<Dialog.Popup
				size="large"
				className="jpb-file-info-dialog__popup"
				style={ { '--jpb-admin-menu-width': `${ adminMenuWidth }px` } as CSSProperties }
			>
				<Dialog.Header>
					<Dialog.Title>
						<span dir="ltr">{ file.name }</span>
					</Dialog.Title>
					<Dialog.CloseIcon label={ __( 'Close preview', 'jetpack-backup-pkg' ) } />
				</Dialog.Header>
				<Dialog.Content className="jpb-file-info-dialog__body">
					<FileInfoMeta modified={ modified } size={ size } mimeType={ mimeType } hash={ hash } />
					{ /* Focusable because `handleReveal` hands focus here. */ }
					<div
						ref={ previewRef }
						className="jpb-file-info-dialog__preview"
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
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
