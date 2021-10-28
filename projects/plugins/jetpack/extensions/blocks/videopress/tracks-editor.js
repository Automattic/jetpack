/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
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
import { MediaUploadCheck, store as blockEditorStore } from '@wordpress/block-editor';
import { upload } from '@wordpress/icons';
import { useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { getFilename } from '@wordpress/url';

const DEFAULT_KIND = 'subtitles';

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

function TrackList( { tracks, onChange, guid } ) {
	const [ isDeletingTrackIndex = -1, setIsDeletingTrackIndex ] = useState();

	const onDeleteTrack = trackIndex => {
		const trackToDelete = tracks[ trackIndex ];
		setIsDeletingTrackIndex( trackIndex );
		if ( 'videoPressUploadTrack' in window ) {
			window
				.videoPressDeleteTrack( guid, trackToDelete.kind, trackToDelete.srcLang )
				.finally( () => {
					onChange( tracks.filter( ( _track, index ) => index !== trackIndex ) );
					setIsDeletingTrackIndex( -1 );
				} );
		} else {
			// wpcom code here?
		}
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
								: __( 'Delete', 'jetpack' ) }
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

function SingleTrackEditor( { track, onChange, onClose, onCancel, guid } ) {
	const [ errorMessage, setErrorMessage ] = useState();
	const [ isSavingTrack = false, setIsSavingTrack ] = useState();
	const { src = '', label = '', srcLang = '', kind = DEFAULT_KIND } = track;

	const fileName = track.tmpFile ? track.tmpFile.name : getFilename( src ) || '';

	const mediaUpload = useSelect( select => {
		return select( blockEditorStore ).getSettings().mediaUpload;
	}, [] );

	if ( ! mediaUpload ) {
		return null;
	}

	return (
		<NavigableMenu>
			<div className="videopress-block-tracks-editor__single-track-editor">
				<span className="videopress-block-tracks-editor__single-track-editor-label">
					{ __( 'Edit track', 'jetpack' ) }
				</span>
				<div className="videopress-block-tracks-editor__single-track-editor-edit-file-label">
					<span>{ __( 'File', 'jetpack' ) }:</span>
					{ '' !== fileName && (
						<span className="videopress-block-tracks-editor__single-track-editor-edit-file-label-name">
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
							accept=".vtt,text/vtt"
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
											: __( 'Change track', 'jetpack' ) }
									</Button>
								);
							} }
							disabled={ isSavingTrack }
						/>
					</MediaUploadCheck>
				</div>
				<div className="videopress-block-tracks-editor__single-track-editor-label-language">
					<TextControl
						/* eslint-disable jsx-a11y/no-autofocus */
						autoFocus
						/* eslint-enable jsx-a11y/no-autofocus */
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
					label={ __( 'Kind', 'jetpack' ) }
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
						<Button
							disabled={ ! track.tmpFile }
							variant="secondary"
							onClick={ () => {
								if ( label === '' ) {
									track.label = __( 'English', 'jetpack' );
								}
								if ( srcLang === '' ) {
									track.srcLang = 'en';
								}
								if ( track.kind === undefined ) {
									track.kind = DEFAULT_KIND;
								}

								setIsSavingTrack( true );

								if ( 'videoPressUploadTrack' in window ) {
									window
										.videoPressUploadTrack(
											guid,
											track.kind,
											track.srcLang,
											track.label,
											track.tmpFile
										)
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
								} else {
									// wpcom code here?
								}
							} }
						>
							{ __( 'Save', 'jetpack' ) }
						</Button>
					) }
					<Button variant="link" onClick={ onCancel }>
						{ __( 'Close', 'jetpack' ) }
					</Button>
				</div>
				{ errorMessage && (
					<div className="videopress-block-tracks-editor__single-track-editor-error">
						{ __( 'Error: ', 'jetpack' ) + errorMessage }
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
							guid={ guid }
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
