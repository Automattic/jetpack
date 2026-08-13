import { Button } from '@wordpress/components';
import { useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, upload } from '@wordpress/icons';
import { Text } from '@wordpress/ui';
import './style.scss';

/**
 * The drag-and-drop upload surface: dashed-SVG outline, drop handling, hint
 * and sub copy, a picker button, and the hidden file input behind it.
 * Extracted from the /upload flow's UploadCard so Home's emptied-library
 * state can offer the same target instead of a button that bounces to
 * another page.
 *
 * Free-plan gating is split with the caller: `disabled` freezes the surface
 * (aria-disabled, drop handlers off, button disabled) while the caller keeps
 * the FreeTierNotice and the slicing of a multi-file drop down to the plan —
 * `dataTransfer` can carry several files regardless of `allowMultiple`, so
 * `onFiles` must always expect an array.
 *
 * @param props               - Component props.
 * @param props.onFiles       - Called with the dropped/selected files.
 * @param props.disabled      - Whether the free-tier limit blocks uploading.
 * @param props.allowMultiple - Whether the picker input accepts several files.
 * @param props.copyVariant   - Copy override. Defaults to follow
 *                            `allowMultiple`; Home's emptied-library state
 *                            passes 'single' even on multi-file plans because
 *                            it is inviting the (new) first video.
 * @return The dropzone element.
 */
const UploadDropzone = ( {
	onFiles,
	disabled = false,
	allowMultiple = false,
	copyVariant,
}: {
	onFiles: ( files: File[] ) => void;
	disabled?: boolean;
	allowMultiple?: boolean;
	copyVariant?: 'single' | 'multiple';
} ) => {
	const inputRef = useRef< HTMLInputElement >( null );
	const [ dragging, setDragging ] = useState( false );
	const plural = ( copyVariant ?? ( allowMultiple ? 'multiple' : 'single' ) ) === 'multiple';
	const dropzoneClassName = `vp-upload-dropzone${ dragging ? ' is-dragging' : '' }${
		disabled ? ' is-disabled' : ''
	}`;

	return (
		<>
			<div
				className={ dropzoneClassName }
				aria-disabled={ disabled }
				onDragOver={
					disabled
						? undefined
						: e => {
								e.preventDefault();
								setDragging( true );
						  }
				}
				onDragLeave={ disabled ? undefined : () => setDragging( false ) }
				onDrop={
					disabled
						? undefined
						: e => {
								e.preventDefault();
								setDragging( false );
								onFiles( Array.from( e.dataTransfer.files ) );
						  }
				}
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
					{ plural
						? __(
								'Add one or several. Each upload gets automatic captions, a player you fully own, and a link to share anywhere. No ads, no algorithm.',
								'jetpack-videopress-pkg'
						  )
						: __(
								'Add one video. Each upload gets automatic captions, a player you fully own, and a link to share anywhere. No ads, no algorithm.',
								'jetpack-videopress-pkg'
						  ) }
				</Text>
				<Button
					variant="primary"
					__next40pxDefaultSize
					onClick={ () => inputRef.current?.click() }
					disabled={ disabled }
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
					onFiles( Array.from( e.target.files ?? [] ) );
					e.currentTarget.value = '';
				} }
			/>
		</>
	);
};

export default UploadDropzone;
