/**
 * External dependencies
 */
import { MediaUploadCheck, store as blockEditorStore } from '@wordpress/block-editor';
import {
	NavigableMenu,
	FormFileUpload,
	Button,
	TextControl,
	SelectControl,
	MenuGroup,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { UploadTrackDataProps } from '../../../../../lib/video-tracks/types';
import { TrackFormProps } from './types';
import type React from 'react';

const DEFAULT_KIND = 'subtitles';

const ACCEPTED_FILE_TYPES = '.vtt,text/vtt';

const KIND_OPTIONS = [
	{ label: __( 'Subtitles', 'jetpack-videopress-pkg' ), value: 'subtitles' },
	{ label: __( 'Captions', 'jetpack-videopress-pkg' ), value: 'captions' },
	{ label: __( 'Descriptions', 'jetpack-videopress-pkg' ), value: 'descriptions' },
	{ label: __( 'Chapters', 'jetpack-videopress-pkg' ), value: 'chapters' },
	{ label: __( 'Metadata', 'jetpack-videopress-pkg' ), value: 'metadata' },
];

/**
 * Track From component
 *
 * @param {TrackFormProps} props - Component props.
 * @returns {React.ReactElement}   Track form react component.
 */
export default function TrackForm( { onCancel }: TrackFormProps ): React.ReactElement {
	const [ errorMessage ] = useState( '' );
	const [ isSavingTrack, setIsSavingTrack ] = useState( false );
	const [ track, setTrack ] = useState< UploadTrackDataProps >( {
		kind: DEFAULT_KIND,
		srcLang: '',
		label: '',
		tmpFile: null,
	} );

	const updateTrack = useCallback(
		( key: 'kind' | 'srcLang' | 'label' | 'tmpFile', value: string | File ) => {
			setTrack( { ...track, [ key ]: value } );
		},
		[ track ]
	);

	const fileName = track.tmpFile?.name;

	const mediaUpload = useSelect( select => {
		return select( blockEditorStore ).getSettings().mediaUpload;
	}, [] );

	const onSaveHandler = useCallback( () => {
		setIsSavingTrack( true );
	}, [] );

	if ( ! mediaUpload ) {
		return null;
	}

	const help = sprintf(
		/* translators: %s: The allowed file types to be uploaded as a video text track." */
		__( 'Add a new text track to the video. Allowed formats: %s', 'jetpack-videopress-pkg' ),
		ACCEPTED_FILE_TYPES
	);

	return (
		<NavigableMenu>
			<MenuGroup
				className="video-tracks-control__track-form"
				label={ __( 'Upload track', 'jetpack-videopress-pkg' ) }
			>
				<div className="video-tracks-control__track-form-container">
					<div className="video-tracks-control__track-form-upload-file">
						<div className="video-tracks-control__track-form-upload-file-label">
							<span>{ __( 'File', 'jetpack-videopress-pkg' ) }:</span>
							{ fileName && <strong>{ fileName }</strong> }
							<MediaUploadCheck>
								<FormFileUpload
									onChange={ event => {
										const files = event.target.files;
										if ( ! files?.length ) {
											return;
										}

										updateTrack( 'tmpFile', files[ 0 ] );
									} }
									accept={ ACCEPTED_FILE_TYPES }
									render={ ( { openFileDialog } ) => {
										return (
											<Button
												variant="link"
												onClick={ () => {
													openFileDialog();
												} }
											>
												{ __( 'Select track', 'jetpack-videopress-pkg' ) }
											</Button>
										);
									} }
								/>
							</MediaUploadCheck>
						</div>
						<div className="video-tracks-control__track-form-upload-file-help">{ help }</div>
					</div>
					<div className="video-tracks-control__track-form-label-language">
						<TextControl
							onChange={ newLabel => updateTrack( 'label', newLabel ) }
							label={ __( 'Label', 'jetpack-videopress-pkg' ) }
							value={ track.label }
							help={ __( 'Title of track', 'jetpack-videopress-pkg' ) }
							disabled={ isSavingTrack }
						/>
						<TextControl
							className="video-tracks-control__track-form-language-tag"
							label={ __( 'Source language', 'jetpack-videopress-pkg' ) }
							value={ track.srcLang }
							onChange={ newSrcLang => updateTrack( 'srcLang', newSrcLang ) }
							help={ __( 'Language (en, fr, etc.)', 'jetpack-videopress-pkg' ) }
							disabled={ isSavingTrack }
						/>
					</div>
					<SelectControl
						options={ KIND_OPTIONS }
						value={ track.kind }
						label={
							/* translators: %s: The kind of video text track e.g: "Subtitles, Captions" */
							__( 'Kind', 'jetpack-videopress-pkg' )
						}
						onChange={ newKind => updateTrack( 'kind', newKind ) }
						disabled={ isSavingTrack }
					/>
					<div className="video-tracks-control__track-form-buttons-container">
						<Button
							isBusy={ isSavingTrack }
							variant="secondary"
							disabled={ ! track.tmpFile || isSavingTrack }
							onClick={ onSaveHandler }
						>
							{ __( 'Save', 'jetpack-videopress-pkg' ) }
						</Button>

						<Button variant="link" onClick={ onCancel }>
							{ __( 'Cancel', 'jetpack-videopress-pkg' ) }
						</Button>
					</div>
					{ errorMessage && (
						<div className="video-tracks-control__track-form-error">
							{
								/* translators: %s: An error message returned after a failed video track file upload." */
								sprintf( __( 'Error: %s', 'jetpack-videopress-pkg' ), errorMessage )
							}
						</div>
					) }
				</div>
			</MenuGroup>
		</NavigableMenu>
	);
}
