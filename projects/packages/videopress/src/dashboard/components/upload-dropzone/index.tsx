import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Button } from '@wordpress/components';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, upload } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { useVideoPressUpgrade } from '../../hooks/use-videopress-upgrade';
import { FREE_TIER_AT_LIMIT_MESSAGE } from '../free-tier-notice';
import { filterVideoFiles } from './video-files';
import './style.scss';
import type { MouseEvent } from 'react';

/**
 * The drag-and-drop upload surface: dashed-SVG outline, drop handling, hint
 * and sub copy, a picker button, and the hidden file input behind it.
 * Extracted from the /upload flow's UploadCard so Home's emptied-library
 * state can offer the same target instead of a button that bounces to
 * another page.
 *
 * Free-plan gating is split with the caller: `disabled` marks the surface and
 * its button as refusing, while the caller keeps the FreeTierNotice and the
 * slicing of a multi-file drop down to the plan — `dataTransfer` can carry
 * several files regardless of `allowMultiple`, so `onFiles` must always expect
 * an array.
 *
 * REFUSING is this component's job, though, not the caller's. A drop the plan
 * or the file type can't accept used to be dropped on the floor here — the
 * handlers were simply unbound while `disabled`, so at the free-plan limit a
 * file dragged onto a surface that still read "Drag and drop your video here"
 * vanished with no error, no toast and no state change. Both refusals now go
 * out as the same error notice the Library's DropZone raises, from the one
 * place that sees every drop, click and pick.
 *
 * @param props               - Component props.
 * @param props.onFiles       - Called with the dropped/selected files, already
 *                            filtered to types the backend accepts.
 * @param props.disabled      - Whether the free-tier limit blocks uploading.
 * @param props.allowMultiple - Whether the picker input accepts several files.
 * @param props.copyVariant   - Copy override. Defaults to follow
 *                            `allowMultiple`; Home's emptied-library state
 *                            passes 'single' even on multi-file plans because
 *                            it is inviting the (new) first video.
 * @param props.subCopy       - Sub-copy override. The default sells the
 *                            product (captions, owned player) for /upload's
 *                            marketing shape; Home's emptied-library state
 *                            passes the quieter "it will show up here"
 *                            promise instead.
 * @return The dropzone element.
 */
const UploadDropzone = ( {
	onFiles,
	disabled = false,
	allowMultiple = false,
	copyVariant,
	subCopy,
}: {
	onFiles: ( files: File[] ) => void;
	disabled?: boolean;
	allowMultiple?: boolean;
	copyVariant?: 'single' | 'multiple';
	subCopy?: string;
} ) => {
	const inputRef = useRef< HTMLInputElement >( null );
	const [ dragging, setDragging ] = useState( false );
	const { createErrorNotice } = useGlobalNotices();
	const runUpgrade = useVideoPressUpgrade();
	const plural = ( copyVariant ?? ( allowMultiple ? 'multiple' : 'single' ) ) === 'multiple';
	const dropzoneClassName = `vp-upload-dropzone${ dragging ? ' is-dragging' : '' }${
		disabled ? ' is-disabled' : ''
	}`;

	// The at-limit refusal, in the same shape the Library's DropZone uses: the
	// short form of the plan sentence, plus the upgrade route the persistent
	// notice above the dropzone already offers.
	const rejectAtLimit = useCallback( () => {
		createErrorNotice( FREE_TIER_AT_LIMIT_MESSAGE, {
			actions: [ { label: __( 'Upgrade', 'jetpack-videopress-pkg' ), onClick: runUpgrade } ],
		} );
	}, [ createErrorNotice, runUpgrade ] );

	// Everything that arrives as files — a drop, or the picker's change —
	// lands here so the type filter and the limit are enforced once. Rejecting
	// a `.txt` renamed `.mp4` at this point is what stops it consuming the free
	// plan's single slot and settling into a permanently broken video.
	const acceptFiles = useCallback(
		( files: File[] ) => {
			// Nothing offered, nothing to refuse — a cancelled file dialog fires
			// a change event with an empty list.
			if ( ! files.length ) {
				return;
			}
			if ( disabled ) {
				rejectAtLimit();
				return;
			}
			const videos = filterVideoFiles( files );
			if ( ! videos.length ) {
				createErrorNotice( __( 'Only video files can be uploaded.', 'jetpack-videopress-pkg' ) );
				return;
			}
			onFiles( videos );
		},
		[ createErrorNotice, disabled, onFiles, rejectAtLimit ]
	);

	const openPicker = useCallback( () => {
		if ( disabled ) {
			rejectAtLimit();
			return;
		}
		inputRef.current?.click();
	}, [ disabled, rejectAtLimit ] );

	const onSurfaceClick = useCallback(
		( event: MouseEvent< HTMLDivElement > ) => {
			// The picker button lives inside this surface and opens the picker
			// itself, so its click has to stop here or the file dialog would be
			// asked for twice.
			if ( ( event.target as HTMLElement ).closest( 'button' ) ) {
				return;
			}
			openPicker();
		},
		[ openPicker ]
	);

	return (
		<>
			{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- the picker button inside this surface is the keyboard (and screen-reader) path; the surface click is a redundant pointer affordance for people who aim at the big target rather than the button. */ }
			<div
				className={ dropzoneClassName }
				aria-disabled={ disabled }
				onClick={ onSurfaceClick }
				onDragOver={ e => {
					e.preventDefault();
					// No brand highlight while disabled — the surface must not
					// promise a drop it is about to refuse — but the handler
					// still runs, because only a bound handler gets a `drop`
					// event to answer with.
					setDragging( ! disabled );
				} }
				onDragLeave={ () => setDragging( false ) }
				onDrop={ e => {
					e.preventDefault();
					setDragging( false );
					acceptFiles( Array.from( e.dataTransfer.files ) );
				} }
			>
				<svg className="vp-upload-dropzone__outline" aria-hidden="true" focusable="false">
					<rect className="vp-upload-dropzone__outline-rect" />
				</svg>
				<Icon icon={ upload } size={ 32 } className="vp-upload-dropzone__icon" />
				<Text variant="body-lg" className="vp-upload-dropzone__hint">
					{ plural
						? __( 'Drag and drop your videos here', 'jetpack-videopress-pkg' )
						: __( 'Drag and drop your video here', 'jetpack-videopress-pkg' ) }
				</Text>
				<Text variant="body-sm" className="vp-upload-dropzone__sub">
					{ subCopy ??
						( plural
							? __(
									'Add one or several. Each upload gets automatic captions, a player you fully own, and a link to share anywhere. No ads, no algorithm.',
									'jetpack-videopress-pkg'
							  )
							: __(
									'Add one video. Each upload gets automatic captions, a player you fully own, and a link to share anywhere. No ads, no algorithm.',
									'jetpack-videopress-pkg'
							  ) ) }
				</Text>
				{ /*
				 * `aria-disabled`, not `disabled`. The two halves of this one
				 * control have to answer the same way, and a `disabled` button
				 * is unfocusable and fires nothing — it could neither be
				 * reached by keyboard nor say why it was refusing, which is
				 * how the surface and the button came to disagree in the first
				 * place. (`accessibleWhenDisabled` is not enough: it adds the
				 * attribute but then swallows the click.) The DS styles
				 * `[aria-disabled="true"]` exactly like `:disabled`, so this
				 * looks unchanged and raises the same notice the surface does.
				 */ }
				<Button
					variant="primary"
					__next40pxDefaultSize
					onClick={ openPicker }
					aria-disabled={ disabled }
				>
					{ plural
						? __( 'Select videos to upload', 'jetpack-videopress-pkg' )
						: __( 'Select a video to upload', 'jetpack-videopress-pkg' ) }
				</Button>
			</div>
			<input
				ref={ inputRef }
				type="file"
				accept="video/*"
				multiple={ allowMultiple }
				className="vp-upload-dropzone__input"
				onChange={ e => {
					acceptFiles( Array.from( e.target.files ?? [] ) );
					e.currentTarget.value = '';
				} }
			/>
		</>
	);
};

export default UploadDropzone;
