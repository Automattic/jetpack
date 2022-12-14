import apiFetch from '@wordpress/api-fetch';
import { MediaUploadCheck, store as blockEditorStore } from '@wordpress/block-editor';
import {
	NavigableMenu,
	MenuItem,
	FormFileUpload,
	MenuGroup,
	ToolbarButton,
	Dropdown,
	SVG,
	Rect,
	Path,
	Button,
	TextControl,
	SelectControl,
	Spinner,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';

const DEFAULT_KIND = 'subtitles';

const ACCEPTED_FILE_TYPES = '.vtt,text/vtt';

const KIND_OPTIONS = [
	{ label: __( 'Subtitles', 'jetpack' ), value: 'subtitles' },
	{ label: __( 'Captions', 'jetpack' ), value: 'captions' },
	{ label: __( 'Descriptions', 'jetpack' ), value: 'descriptions' },
	{ label: __( 'Chapters', 'jetpack' ), value: 'chapters' },
	{ label: __( 'Metadata', 'jetpack' ), value: 'metadata' },
];

const captionIcon = (
	<SVG width="18" height="14" viewBox="0 0 18 14" role="img" fill="none">
		<Rect
			x="0.75"
			y="0.75"
			width="16.5"
			height="12.5"
			rx="1.25"
			stroke="black"
			strokeWidth="1.5"
			fill="none"
		/>
		<Path d="M3 7H15" stroke="black" strokeWidth="1.5" />
		<Path d="M3 10L15 10" stroke="black" strokeWidth="1.5" />
	</SVG>
);

/**
 * Determines if api requests should be made via the `gutenberg-video-upload` script (Jetpack only).
 *
 * @returns {boolean} if the upload script should be used or not.
 */
const shouldUseJetpackVideoFetch = () => {
	return 'videoPressUploadTrack' in window;
};

/**
 * Uploads a track to a video.
 * Uses different methods depending on Jetpack or WPCOM.
 *
 * @param {object} track - the track file
 * @param {string} guid - the video guid
 * @returns {Promise} the api request promise
 */
export const uploadTrackForGuid = ( track, guid ) => {
	if ( shouldUseJetpackVideoFetch() ) {
		return window.videoPressUploadTrack(
			guid,
			track.kind,
			track.srcLang,
			track.label,
			track.tmpFile
		);
	}

	const options = {
		method: 'POST',
		path: `/videos/${ guid }/tracks`,
		apiNamespace: 'rest/v1.1',
		global: true,
		parse: false,
		formData: [
			[ 'kind', track.kind ],
			[ 'srclang', track.srcLang ],
			[ 'label', track.label ],
			[ 'vtt', track.tmpFile ],
		],
	};

	return apiFetch( options );
};

/**
 * -Deletes a track from a video.
 * -Uses different methods depending on Jetpack or WPCOM.
 *
 * @param {object} track - the track file
 * @param {string} guid - the video guid
 * @returns {Promise} the api request promise.
 */
const deleteTrackForGuid = ( track, guid ) => {
	if ( shouldUseJetpackVideoFetch() ) {
		return window.videoPressDeleteTrack( guid, track.kind, track.srcLang );
	}

	const options = {
		method: 'POST',
		path: `/videos/${ guid }/tracks/delete`,
		apiNamespace: 'rest/v1.1',
		global: true,
		parse: false,
		formData: [
			[ 'kind', track.kind ],
			[ 'srclang', track.srcLang ],
		],
	};

	return apiFetch( options );
};

function TrackList( { tracks, onChange, guid } ) {
	const [ isDeletingTrackIndex = -1, setIsDeletingTrackIndex ] = useState();

	const onDeleteTrack = trackIndex => {
		const trackToDelete = tracks[ trackIndex ];
		setIsDeletingTrackIndex( trackIndex );
		deleteTrackForGuid( trackToDelete, guid ).finally( () => {
			onChange( tracks.filter( ( _track, index ) => index !== trackIndex ) );
			setIsDeletingTrackIndex( -1 );
		} );
	};

	let content;
	if ( tracks.length === 0 ) {
		content = (
			<p className="videopress-block-tracks-editor__tracks-informative-message">
				{ __(
					'Tracks can be subtitles, captions, chapters, or descriptions. They help make your content more accessible to a wider range of users.',
					'jetpack'
				) }
			</p>
		);
	} else {
		content = tracks.map( ( track, index ) => {
			return (
				<div key={ index } className="videopress-block-tracks-editor__track-list-track">
					<span>{ track.label }</span>
					<div className="videopress-block-tracks-editor__track-list-track-delete">
						<Button
							variant="link"
							isDestructive
							onClick={ () => {
								onDeleteTrack( index );
							} }
							aria-label={ sprintf(
								/* translators: %s: Label of the video text track e.g: "French subtitles" */
								__( 'Delete %s', 'jetpack' ),
								track.label
							) }
							disabled={ isDeletingTrackIndex === index }
						>
							{ isDeletingTrackIndex === index
								? __( 'Deleting', 'jetpack' )
								: __( 'Delete', 'jetpack', /* dummy arg to avoid bad minification */ 0 ) }
						</Button>
					</div>
				</div>
			);
		} );
	}

	return (
		<MenuGroup
			label={ __( 'Text tracks', 'jetpack' ) }
			className="videopress-block-tracks-editor__track-list"
		>
			{ content }
		</MenuGroup>
	);
}

function SingleTrackEditor( { track, guid, onChange, onClose, onCancel, trackExists } ) {
	const [ errorMessage, setErrorMessage ] = useState();
	const [ isSavingTrack = false, setIsSavingTrack ] = useState();
	const { label = '', srcLang = '', kind = DEFAULT_KIND } = track;

	const fileName = track.tmpFile ? track.tmpFile.name : '';

	const mediaUpload = useSelect( select => {
		return select( blockEditorStore ).getSettings().mediaUpload;
	}, [] );

	if ( ! mediaUpload ) {
		return null;
	}

	const onSave = () => {
		setErrorMessage( null );
		if ( label === '' ) {
			track.label = __( 'English', 'jetpack' );
		}
		if ( srcLang === '' ) {
			track.srcLang = 'en';
		}
		if ( track.kind === undefined ) {
			track.kind = DEFAULT_KIND;
		}

		if ( trackExists( track ) ) {
			setErrorMessage( __( 'A track already exists for that language and kind.', 'jetpack' ) );
			return;
		}

		setIsSavingTrack( true );

		uploadTrackForGuid( track, guid )
			.then( () => {
				onChange( track );
				setErrorMessage( null );
				onClose();
			} )
			.catch( error => {
				if ( error.message ) {
					setErrorMessage( error.message );
				}
			} )
			.finally( () => {
				setIsSavingTrack( false );
			} );
	};

	return (
		<NavigableMenu>
			<div className="videopress-block-tracks-editor__single-track-editor">
				<span className="videopress-block-tracks-editor__single-track-editor-label">
					{ __( 'Edit track', 'jetpack' ) }
				</span>
				<div className="videopress-block-tracks-editor__single-track-editor-upload-file">
					<div className="videopress-block-tracks-editor__single-track-editor-upload-file-label">
						<span>{ __( 'File', 'jetpack' ) }:</span>
						{ '' !== fileName && (
							<span className="videopress-block-tracks-editor__single-track-editor-upload-file-label-name">
								<strong>{ fileName }</strong>
							</span>
						) }
						<MediaUploadCheck>
							<FormFileUpload
								onChange={ event => {
									const files = event.target.files;

									if ( ! files.length > 0 ) {
										return;
									}

									track.tmpFile = files[ 0 ];
									onChange( track );
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
											{ '' === fileName
												? __( 'Select track', 'jetpack' )
												: __(
														'Change track',
														'jetpack',
														/* dummy arg to avoid bad minification */ 0
												  ) }
										</Button>
									);
								} }
								disabled={ isSavingTrack }
							/>
						</MediaUploadCheck>
					</div>
					<div className="videopress-block-tracks-editor__single-track-editor-upload-file-help">
						{
							/* translators: %s: The allowed file types to be uploaded as a video text track." */
							sprintf( __( 'Allowed formats: %s', 'jetpack' ), ACCEPTED_FILE_TYPES )
						}
					</div>
				</div>
				<div className="videopress-block-tracks-editor__single-track-editor-label-language">
					<TextControl
						onChange={ newLabel =>
							onChange( {
								...track,
								label: newLabel,
							} )
						}
						label={ __( 'Label', 'jetpack' ) }
						value={ label }
						help={ __( 'Title of track', 'jetpack' ) }
						disabled={ isSavingTrack }
					/>
					<TextControl
						onChange={ newSrcLang =>
							onChange( {
								...track,
								srcLang: newSrcLang,
							} )
						}
						label={ __( 'Source language', 'jetpack' ) }
						value={ srcLang }
						help={ __( 'Language tag (en, fr, etc.)', 'jetpack' ) }
						disabled={ isSavingTrack }
					/>
				</div>
				<SelectControl
					className="videopress-block-tracks-editor__single-track-editor-kind-select"
					options={ KIND_OPTIONS }
					value={ kind }
					label={
						/* translators: %s: The kind of video text track e.g: "Subtitles, Captions" */
						__( 'Kind', 'jetpack' )
					}
					onChange={ newKind => {
						onChange( {
							...track,
							kind: newKind,
						} );
					} }
					disabled={ isSavingTrack }
				/>
				<div className="videopress-block-tracks-editor__single-track-editor-buttons-container">
					{ isSavingTrack ? (
						<Spinner />
					) : (
						<Button variant="secondary" disabled={ ! track.tmpFile } onClick={ onSave }>
							{ __( 'Save', 'jetpack' ) }
						</Button>
					) }
					<Button variant="link" onClick={ onCancel }>
						{ __( 'Close', 'jetpack' ) }
					</Button>
				</div>
				{ errorMessage && (
					<div className="videopress-block-tracks-editor__single-track-editor-error">
						{
							/* translators: %s: An error message returned after a failed video track file upload." */
							sprintf( __( 'Error: %s', 'jetpack' ), errorMessage )
						}
					</div>
				) }
			</div>
		</NavigableMenu>
	);
}

export default function TracksEditor( { tracks = [], onChange, guid } ) {
	const [ trackBeingEdited, setTrackBeingEdited ] = useState( null );

	const addNewTrack = () => {
		const trackIndex = tracks.length;
		const newTracks = [ ...tracks ];

		if ( ! newTracks[ trackIndex ] ) {
			newTracks[ trackIndex ] = {};
		}

		newTracks[ trackIndex ] = {
			...tracks[ trackIndex ],
		};
		onChange( newTracks );
		setTrackBeingEdited( trackIndex );
	};

	return (
		<Dropdown
			contentClassName="videopress-block-tracks-editor"
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ToolbarButton
					label={ __( 'Text tracks', 'jetpack' ) }
					showTooltip
					aria-expanded={ isOpen }
					aria-haspopup="true"
					onClick={ onToggle }
					icon={ captionIcon }
				/>
			) }
			renderContent={ () => {
				if ( trackBeingEdited !== null ) {
					return (
						<SingleTrackEditor
							track={ tracks[ trackBeingEdited ] }
							guid={ guid }
							onChange={ newTrack => {
								const newTracks = [ ...tracks ];
								newTracks[ trackBeingEdited ] = newTrack;
								onChange( newTracks );
							} }
							onClose={ () => setTrackBeingEdited( null ) }
							onCancel={ () => {
								onChange( tracks.filter( ( _track, index ) => index !== trackBeingEdited ) );
								setTrackBeingEdited( null );
							} }
							trackExists={ newTrack => {
								const oldTracks = tracks.filter( ( value, index ) => {
									return index !== trackBeingEdited;
								} );
								return (
									-1 !==
									oldTracks.findIndex( track => {
										return track.kind === newTrack.kind && track.srcLang === newTrack.srcLang;
									} )
								);
							} }
						/>
					);
				}
				return (
					<>
						<NavigableMenu>
							<TrackList tracks={ tracks } onChange={ onChange } guid={ guid } />
							<MenuGroup
								className="videopress-block-tracks-editor__add-tracks-container"
								label={ __( 'Add tracks', 'jetpack' ) }
							>
								<MenuItem
									icon={ upload }
									onClick={ () => {
										addNewTrack();
									} }
								>
									{ __( 'Upload track', 'jetpack' ) }
								</MenuItem>
							</MenuGroup>
						</NavigableMenu>
					</>
				);
			} }
		/>
	);
}
