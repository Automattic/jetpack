import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Button, Tooltip } from '@wordpress/components';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, upload } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import { useVideoPressUpgrade } from '../../hooks/use-videopress-upgrade';
import { FREE_TIER_AT_LIMIT_MESSAGE, FREE_TIER_AT_LIMIT_NOTICE_ID } from '../free-tier-notice';
import {
	describeRefusal,
	filterVideoFiles,
	INVALID_FILE_NOTICE_ID,
	videoFileAccept,
} from './video-files';
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
	// notice above the dropzone already offers. The stable id is what keeps a
	// fourth blocked drop from stacking a fourth identical black bar.
	const rejectAtLimit = useCallback( () => {
		createErrorNotice( FREE_TIER_AT_LIMIT_MESSAGE, {
			id: FREE_TIER_AT_LIMIT_NOTICE_ID,
			actions: [ { label: __( 'Upgrade', 'jetpack-videopress-pkg' ), onClick: runUpgrade } ],
		} );
	}, [ createErrorNotice, runUpgrade ] );

	// Everything that arrives as files — a drop, or the picker's change —
	// lands here so the type filter and the limit are enforced once. Rejecting
	// a `.txt` renamed `.mp4` at this point is what stops it consuming the free
	// plan's single slot and settling into a permanently broken video.
	//
	// Async because the type filter now reads the file's leading bytes; nothing
	// blocks while it does, and the notice below is the only thing waiting on it.
	const acceptFiles = useCallback(
		async ( files: File[] ) => {
			// Nothing offered, nothing to refuse — a cancelled file dialog fires
			// a change event with an empty list.
			if ( ! files.length ) {
				return;
			}
			// The file check runs BEFORE the plan gate, and the order is the fix:
			// with the limit first, dropping a renamed `.txt` at the cap was
			// answered with "You've reached the free plan's 1-video limit" — a
			// fact about the plan standing in for the answer to a question about
			// the file, which sent both testers off to check their plan.
			const videos = await filterVideoFiles( files );
			if ( ! videos.length ) {
				// The message is derived, not fixed: a real `.webm` is a video we
				// can't take, and saying "Only video files can be uploaded" to
				// someone holding one is simply untrue.
				createErrorNotice( await describeRefusal( files ), {
					id: INVALID_FILE_NOTICE_ID,
				} );
				return;
			}
			if ( disabled ) {
				rejectAtLimit();
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

	const pickerButton = (
		<Button
			className="vp-upload-dropzone__button"
			variant="primary"
			__next40pxDefaultSize
			onClick={ openPicker }
			aria-disabled={ disabled }
		>
			{ plural
				? __( 'Select videos to upload', 'jetpack-videopress-pkg' )
				: __( 'Select a video to upload', 'jetpack-videopress-pkg' ) }
		</Button>
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
					// `void`: the refusal (or the hand-off to onFiles) settles a
					// microtask later, after the header read; nothing here waits.
					void acceptFiles( Array.from( e.dataTransfer.files ) );
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
				 * attribute but then swallows the click.)
				 *
				 * What `aria-disabled` does NOT buy is the look: the DS dims
				 * `:disabled`, not the ARIA attribute, so at the plan limit
				 * this sat in full brand blue with a plain pointer and read as
				 * completely live until you clicked it — while the header
				 * "Upload video" button one screen away was dimmed, refusing
				 * and tooltipped. Two contradicting conventions for the same
				 * state. The stylesheet dims this one to match, and the
				 * Tooltip below gives the same sentence on hover that the
				 * click raises as a notice. Both, not either: hover is what a
				 * mouse user gets before committing, and the click-to-explain
				 * is the only path a touch user has.
				 */ }
				{ disabled ? (
					// Only at the limit. An enabled tooltip here would just
					// restate the button's own label; the header needs one
					// because it is refusing from a toolbar with no copy
					// around it.
					<Tooltip text={ FREE_TIER_AT_LIMIT_MESSAGE }>{ pickerButton }</Tooltip>
				) : (
					pickerButton
				) }
			</div>
			<input
				ref={ inputRef }
				type="file"
				// The allow-list, not `video/*`. Under `video/*` the OS dialog
				// offered `.webm` and `.mkv` — real videos this backend refuses —
				// and both testers picked one and were told their video wasn't a
				// video. A drop can't be narrowed this way, so it leans on
				// `describeRefusal` instead; this just stops the picker from
				// setting the trap in the first place.
				accept={ videoFileAccept() }
				multiple={ allowMultiple }
				className="vp-upload-dropzone__input"
				onChange={ e => {
					// Both reads happen before the await inside acceptFiles: the
					// input is cleared synchronously so picking the same file twice
					// in a row still fires a change event.
					const input = e.currentTarget;
					void acceptFiles( Array.from( e.target.files ?? [] ) );
					input.value = '';
				} }
			/>
		</>
	);
};

export default UploadDropzone;
