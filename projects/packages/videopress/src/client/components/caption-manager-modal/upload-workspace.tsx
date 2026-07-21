/**
 * External dependencies
 */
import { Button, FormFileUpload } from '@wordpress/components';
import { useFocusOnMount, useViewportMatch } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { getLanguageDisplayName } from '../../lib/video-tracks/language';
import CaptionPreviewPlayer from './caption-preview-player';
import LanguageControl from './language-control';
import { ACCEPTED_FILE_TYPES, SUPPORTED_CAPTION_FORMATS_LABEL } from './track-helpers';
/**
 * Types
 */
import type { CaptionPreviewProps } from './caption-preview-player';
import type { UploadWorkspace as UploadWorkspaceState } from './workspace-reducer';
import type { ChangeEvent, ReactElement } from 'react';

const UPLOAD_FORM_TITLE_LABELS = {
	add: __( 'Upload subtitle track', 'jetpack-videopress-pkg' ),
	replace: __( 'Replace subtitle track', 'jetpack-videopress-pkg' ),
};

const UPLOAD_FORM_ACTION_LABELS = {
	add: __( 'Upload track', 'jetpack-videopress-pkg' ),
	replace: __( 'Replace track', 'jetpack-videopress-pkg' ),
};

type UploadWorkspaceProps = {
	workspace: UploadWorkspaceState;
	isSaving: boolean;
	/** Video props for the preview player. */
	preview: CaptionPreviewProps;
	/** Languages that already have a track, left out of the language picker. */
	excludedLanguages: string[];
	onLanguageChange: ( tag: string, displayName: string ) => void;
	onFileChange: ( file: File | null ) => void;
	onCancelReplace: () => void;
	onSubmit: () => void;
};

/**
 * The subtitle file upload form: language picker, file picker, and the
 * submit/cancel actions, next to the video preview.
 *
 * @param props                   - Component props.
 * @param props.workspace         - Upload workspace state.
 * @param props.isSaving          - Whether an upload is in flight.
 * @param props.preview           - Video props for the preview player.
 * @param props.excludedLanguages - Languages left out of the language picker.
 * @param props.onLanguageChange  - Called with the selected language tag and display name.
 * @param props.onFileChange      - Called with the chosen file.
 * @param props.onCancelReplace   - Called when a replace is cancelled.
 * @param props.onSubmit          - Called to submit the form.
 * @return The upload workspace.
 */
export default function UploadWorkspace( {
	workspace,
	isSaving,
	preview,
	excludedLanguages,
	onLanguageChange,
	onFileChange,
	onCancelReplace,
	onSubmit,
}: UploadWorkspaceProps ): ReactElement {
	const { form, mode, replacingTrack } = workspace;
	const uploadFormTitle = UPLOAD_FORM_TITLE_LABELS[ mode ];
	const fileName = form.tmpFile?.name;

	/*
	 * Focus the workspace container (not the language field) on mount, so
	 * entering the view never grabs the close button or the picker.
	 */
	const focusOnMountRef = useFocusOnMount( true );
	// Match the manual editor: no video preview on mobile (don't mount the player).
	const isCompact = useViewportMatch( 'large', '<' );

	return (
		<div
			className="videopress-caption-manager__editor-body videopress-caption-manager__editor-body--upload"
			ref={ focusOnMountRef }
			tabIndex={ -1 }
		>
			<div className="videopress-caption-manager__upload-panel" aria-label={ uploadFormTitle }>
				{ mode === 'replace' && replacingTrack && (
					<p className="videopress-caption-manager__form-note">
						{ sprintf(
							/* translators: %s: subtitle track language being replaced. */
							__( 'Replacing %s', 'jetpack-videopress-pkg' ),
							getLanguageDisplayName( replacingTrack.srcLang )
						) }
					</p>
				) }

				<div className="videopress-caption-manager__form-grid">
					<LanguageControl
						label={ __( 'Language', 'jetpack-videopress-pkg' ) }
						value={ form.srcLang }
						onChange={ onLanguageChange }
						disabled={ isSaving || mode === 'replace' }
						excludedLanguages={ excludedLanguages }
					/>
				</div>

				<FormFileUpload
					accept={ ACCEPTED_FILE_TYPES }
					onChange={ ( event: ChangeEvent< HTMLInputElement > ) => {
						onFileChange( event.target.files?.[ 0 ] ?? null );
					} }
					render={ ( { openFileDialog } ) => (
						<div className="videopress-caption-manager__file-picker">
							<Button variant="secondary" icon={ upload } onClick={ openFileDialog }>
								{ fileName || __( 'Select subtitle file', 'jetpack-videopress-pkg' ) }
							</Button>
							<p>
								{ sprintf(
									/* translators: %s: accepted subtitle file extensions. */
									__( 'Accepted formats: %s', 'jetpack-videopress-pkg' ),
									SUPPORTED_CAPTION_FORMATS_LABEL
								) }
							</p>
						</div>
					) }
					__next40pxDefaultSize={ true }
				/>

				<div className="videopress-caption-manager__form-actions">
					{ mode === 'replace' && (
						<Button variant="secondary" onClick={ onCancelReplace } disabled={ isSaving }>
							{ __( 'Cancel replace', 'jetpack-videopress-pkg' ) }
						</Button>
					) }
					<Button
						variant="primary"
						onClick={ onSubmit }
						isBusy={ isSaving }
						disabled={ isSaving || ! form.tmpFile }
					>
						{ UPLOAD_FORM_ACTION_LABELS[ mode ] }
					</Button>
				</div>
			</div>
			{ ! isCompact && <CaptionPreviewPlayer { ...preview } /> }
		</div>
	);
}
