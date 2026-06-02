/**
 * External dependencies
 */
import {
	Button,
	FormFileUpload,
	Modal,
	Notice,
	SelectControl,
	TextControl,
} from '@wordpress/components';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { upload, trash } from '@wordpress/icons';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import { deleteTrackForGuid, TRACK_KIND_OPTIONS, uploadTrackForGuid } from '../../lib/video-tracks';
import {
	canonicalizeLanguageTag,
	formatLanguageTagForDisplay,
} from '../../lib/video-tracks/language';
import './style.scss';
/**
 * Types
 */
import type { CaptionManagerModalProps } from './types';
import type {
	trackKindOptionProps,
	UploadTrackDataProps,
	VideoTextTrack,
} from '../../lib/video-tracks/types';
import type { ChangeEvent, ReactElement } from 'react';

const debug = debugFactory( 'videopress:caption-manager-modal' );

const DEFAULT_KIND: trackKindOptionProps = 'captions';

const ACCEPTED_FILE_TYPES: Record< string, string > = {
	'.vtt': 'text/vtt',
	'.srt': 'application/x-subrip',
};

const KIND_LABELS: Record< trackKindOptionProps, string > = {
	subtitles: __( 'Subtitles', 'jetpack-videopress-pkg' ),
	captions: __( 'Captions', 'jetpack-videopress-pkg' ),
	descriptions: __( 'Descriptions', 'jetpack-videopress-pkg' ),
	chapters: __( 'Chapters', 'jetpack-videopress-pkg' ),
	metadata: __( 'Metadata', 'jetpack-videopress-pkg' ),
};

type FormTrack = {
	kind: trackKindOptionProps;
	srcLang: string;
	label: string;
	tmpFile: File | null;
};

type FormMode = 'add' | 'replace';

type TrackApiError = {
	error?: string;
	message?: string;
};

const FORM_TITLE_LABELS: Record< FormMode, string > = {
	add: __( 'Upload caption track', 'jetpack-videopress-pkg' ),
	replace: __( 'Replace caption track', 'jetpack-videopress-pkg' ),
};

const FORM_ACTION_LABELS: Record< FormMode, string > = {
	add: __( 'Upload track', 'jetpack-videopress-pkg' ),
	replace: __( 'Replace track', 'jetpack-videopress-pkg' ),
};

const emptyTrackForm = (): FormTrack => ( {
	kind: DEFAULT_KIND,
	srcLang: '',
	label: '',
	tmpFile: null,
} );

const getTrackKey = ( track: Pick< VideoTextTrack, 'kind' | 'srcLang' > ) =>
	`${ track.kind }:${ track.srcLang }`;

const isAcceptedTrackFile = ( file: File | null ): boolean => {
	if ( ! file ) {
		return false;
	}

	const lowerName = file.name.toLowerCase();
	return Object.keys( ACCEPTED_FILE_TYPES ).some( extension => lowerName.endsWith( extension ) );
};

const hasTrackApiError = ( response: unknown ): response is TrackApiError =>
	typeof response === 'object' &&
	response !== null &&
	'error' in response &&
	!! ( response as TrackApiError ).error;

const getTrackApiErrorMessage = ( response: unknown, fallback: string ): string => {
	if ( typeof response === 'object' && response !== null ) {
		const { error: errorCode, message } = response as TrackApiError;
		return message || errorCode || fallback;
	}

	return fallback;
};

const acceptedFileTypes = Object.entries( ACCEPTED_FILE_TYPES )
	.flatMap( ( [ extension, mimeType ] ) => [ extension, mimeType ] )
	.join( ',' );

/**
 * Shared VideoPress caption manager modal.
 *
 * @param props                - Component props.
 * @param props.isOpen         - Whether the modal is open.
 * @param props.guid           - VideoPress GUID.
 * @param props.title          - Optional video title.
 * @param props.tracks         - Current track list.
 * @param props.onClose        - Close handler.
 * @param props.onTracksChange - Called with the updated track list.
 * @return Caption manager modal.
 */
export default function CaptionManagerModal( {
	isOpen,
	guid,
	title,
	tracks,
	onClose,
	onTracksChange,
}: CaptionManagerModalProps ): ReactElement | null {
	const [ formTrack, setFormTrack ] = useState< FormTrack >( emptyTrackForm );
	const [ mode, setMode ] = useState< FormMode >( 'add' );
	const [ replacingTrack, setReplacingTrack ] = useState< VideoTextTrack | null >( null );
	const [ error, setError ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ deletingTrackKey, setDeletingTrackKey ] = useState< string | null >( null );

	useEffect( () => {
		if ( isOpen ) {
			setFormTrack( emptyTrackForm() );
			setMode( 'add' );
			setReplacingTrack( null );
			setError( '' );
		}
	}, [ isOpen ] );

	const kindOptions = useMemo(
		() =>
			TRACK_KIND_OPTIONS.map( kind => ( {
				label: KIND_LABELS[ kind ],
				value: kind,
			} ) ),
		[]
	);

	const updateFormTrack = useCallback( ( key: keyof FormTrack, value: string | File | null ) => {
		setFormTrack( current => ( { ...current, [ key ]: value } ) );
		setError( '' );
	}, [] );

	const resetForm = useCallback( () => {
		setFormTrack( emptyTrackForm() );
		setMode( 'add' );
		setReplacingTrack( null );
		setError( '' );
	}, [] );

	const replaceTrack = useCallback( ( track: VideoTextTrack ) => {
		setMode( 'replace' );
		setReplacingTrack( track );
		setFormTrack( {
			kind: track.kind,
			srcLang: formatLanguageTagForDisplay( track.srcLang ),
			label: track.label,
			tmpFile: null,
		} );
		setError( '' );
	}, [] );

	const deleteTrack = useCallback(
		async ( track: VideoTextTrack ) => {
			const key = getTrackKey( track );
			setDeletingTrackKey( key );
			setError( '' );

			try {
				const response = await deleteTrackForGuid( track, guid );
				if ( hasTrackApiError( response ) ) {
					setError(
						sprintf(
							/* translators: %s: VideoPress API error. */
							__( 'Track error: %s', 'jetpack-videopress-pkg' ),
							getTrackApiErrorMessage(
								response,
								__( 'Unable to delete track.', 'jetpack-videopress-pkg' )
							)
						)
					);
					return;
				}

				onTracksChange( tracks.filter( current => getTrackKey( current ) !== key ) );
			} catch ( deleteError ) {
				debug( 'delete track error', deleteError );
				setError(
					sprintf(
						/* translators: %s: VideoPress API error. */
						__( 'Track error: %s', 'jetpack-videopress-pkg' ),
						getTrackApiErrorMessage(
							deleteError,
							__( 'Unable to delete track.', 'jetpack-videopress-pkg' )
						)
					)
				);
			} finally {
				setDeletingTrackKey( null );
			}
		},
		[ guid, onTracksChange, tracks ]
	);

	const saveTrack = useCallback( async () => {
		if ( ! formTrack.tmpFile ) {
			setError( __( 'Select a caption file before saving.', 'jetpack-videopress-pkg' ) );
			return;
		}

		if ( ! isAcceptedTrackFile( formTrack.tmpFile ) ) {
			setError( __( 'Only .vtt and .srt files are supported.', 'jetpack-videopress-pkg' ) );
			return;
		}

		const canonicalSrcLang = canonicalizeLanguageTag( formTrack.srcLang );
		const srcLang =
			mode === 'replace' && replacingTrack
				? canonicalSrcLang ?? replacingTrack.srcLang
				: canonicalSrcLang;

		if ( ! srcLang ) {
			setError( __( 'Enter a valid BCP-47 language tag.', 'jetpack-videopress-pkg' ) );
			return;
		}

		const existingTrackIndex = tracks.findIndex(
			track => track.kind === formTrack.kind && track.srcLang === srcLang
		);

		if ( mode === 'add' && existingTrackIndex > -1 ) {
			setError(
				__(
					'A track already exists for that kind and language. Use Replace on the existing track to upload a new file.',
					'jetpack-videopress-pkg'
				)
			);
			return;
		}

		const trackToUpload: UploadTrackDataProps = {
			kind: formTrack.kind,
			srcLang,
			label: formTrack.label.trim(),
			tmpFile: formTrack.tmpFile,
		};

		setIsSaving( true );
		setError( '' );

		try {
			const src = await uploadTrackForGuid( trackToUpload, guid );
			if ( hasTrackApiError( src ) ) {
				setError(
					sprintf(
						/* translators: %s: VideoPress API error. */
						__( 'Track error: %s', 'jetpack-videopress-pkg' ),
						getTrackApiErrorMessage(
							src,
							__( 'Unable to upload track.', 'jetpack-videopress-pkg' )
						)
					)
				);
				return;
			}

			const uploadedTrack: VideoTextTrack = {
				kind: trackToUpload.kind,
				srcLang: trackToUpload.srcLang,
				label: trackToUpload.label,
				src: String( src ),
			};

			const updatedTracks = [ ...tracks ];
			const updatedTrackIndex =
				mode === 'replace'
					? tracks.findIndex(
							track =>
								track.kind === replacingTrack?.kind && track.srcLang === replacingTrack?.srcLang
					  )
					: existingTrackIndex;

			if ( updatedTrackIndex > -1 ) {
				updatedTracks[ updatedTrackIndex ] = uploadedTrack;
			} else {
				updatedTracks.push( uploadedTrack );
			}

			onTracksChange( updatedTracks );
			resetForm();
		} catch ( uploadError ) {
			debug( 'upload track error', uploadError );
			setError(
				sprintf(
					/* translators: %s: VideoPress API error. */
					__( 'Track error: %s', 'jetpack-videopress-pkg' ),
					getTrackApiErrorMessage(
						uploadError,
						__( 'Unable to upload track.', 'jetpack-videopress-pkg' )
					)
				)
			);
		} finally {
			setIsSaving( false );
		}
	}, [ formTrack, guid, mode, onTracksChange, replacingTrack, resetForm, tracks ] );

	const formTitle = FORM_TITLE_LABELS[ mode ];
	const fileName = formTrack.tmpFile?.name;
	const emptyMessage = __(
		'No caption tracks have been added to this video yet.',
		'jetpack-videopress-pkg'
	);

	return isOpen ? (
		<Modal
			title={ __( 'Manage captions', 'jetpack-videopress-pkg' ) }
			onRequestClose={ onClose }
			className="videopress-caption-manager"
		>
			<div className="videopress-caption-manager__workspace">
				<section className="videopress-caption-manager__tracks">
					<div className="videopress-caption-manager__tracks-header">
						<div>
							<h2>{ __( 'Caption tracks', 'jetpack-videopress-pkg' ) }</h2>
							{ title && <p>{ title }</p> }
						</div>
					</div>

					{ tracks.length ? (
						<div className="videopress-caption-manager__track-list">
							{ tracks.map( track => {
								const key = getTrackKey( track );
								const language = formatLanguageTagForDisplay( track.srcLang );
								const isDeleting = deletingTrackKey === key;

								return (
									<div className="videopress-caption-manager__track" key={ key }>
										<div className="videopress-caption-manager__track-meta">
											<strong>{ track.label || language }</strong>
											<span>
												{ KIND_LABELS[ track.kind ] } · { language }
											</span>
										</div>
										<div className="videopress-caption-manager__track-actions">
											<Button
												variant="secondary"
												onClick={ () => replaceTrack( track ) }
												disabled={ isSaving || !! deletingTrackKey }
											>
												{ __( 'Replace', 'jetpack-videopress-pkg' ) }
											</Button>
											<Button
												variant="link"
												icon={ trash }
												isDestructive
												isBusy={ isDeleting }
												disabled={ isSaving || isDeleting }
												onClick={ () => deleteTrack( track ) }
											>
												{ __( 'Delete', 'jetpack-videopress-pkg' ) }
											</Button>
										</div>
									</div>
								);
							} ) }
						</div>
					) : (
						<div className="videopress-caption-manager__empty">{ emptyMessage }</div>
					) }
				</section>

				<section className="videopress-caption-manager__form" aria-label={ formTitle }>
					<div className="videopress-caption-manager__form-header">
						<h2>{ formTitle }</h2>
						{ mode === 'replace' && replacingTrack && (
							<p>
								{ sprintf(
									/* translators: %s: caption track language tag. */
									__( 'Replacing %s', 'jetpack-videopress-pkg' ),
									formatLanguageTagForDisplay( replacingTrack.srcLang )
								) }
							</p>
						) }
					</div>

					<FormFileUpload
						accept={ acceptedFileTypes }
						onChange={ ( event: ChangeEvent< HTMLInputElement > ) => {
							const file = event.target.files?.[ 0 ] ?? null;
							updateFormTrack( 'tmpFile', file );
						} }
						render={ ( { openFileDialog } ) => (
							<div className="videopress-caption-manager__file-picker">
								<Button variant="secondary" icon={ upload } onClick={ openFileDialog }>
									{ fileName || __( 'Select .vtt or .srt file', 'jetpack-videopress-pkg' ) }
								</Button>
								<p>
									{ sprintf(
										/* translators: %s: allowed caption file extensions. */
										__( 'Allowed formats: %s', 'jetpack-videopress-pkg' ),
										Object.keys( ACCEPTED_FILE_TYPES ).join( ', ' )
									) }
								</p>
							</div>
						) }
						__next40pxDefaultSize={ true }
					/>

					<div className="videopress-caption-manager__form-grid">
						<TextControl
							label={ __( 'Label', 'jetpack-videopress-pkg' ) }
							value={ formTrack.label }
							onChange={ value => updateFormTrack( 'label', value ) }
							disabled={ isSaving }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>
						<TextControl
							label={ __( 'Language', 'jetpack-videopress-pkg' ) }
							value={ formTrack.srcLang }
							onChange={ value => updateFormTrack( 'srcLang', value ) }
							help={ __(
								'Use a BCP-47 language tag, like en, en-US, or pt-BR.',
								'jetpack-videopress-pkg'
							) }
							disabled={ isSaving || mode === 'replace' }
							__nextHasNoMarginBottom={ true }
							__next40pxDefaultSize={ true }
						/>
					</div>

					<SelectControl
						label={ __( 'Kind', 'jetpack-videopress-pkg' ) }
						options={ kindOptions }
						value={ formTrack.kind }
						onChange={ value => updateFormTrack( 'kind', value ) }
						disabled={ isSaving || mode === 'replace' }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>

					{ error && (
						<Notice status="error" isDismissible={ false }>
							{ error }
						</Notice>
					) }

					<div className="videopress-caption-manager__form-actions">
						{ mode === 'replace' && (
							<Button variant="secondary" onClick={ resetForm } disabled={ isSaving }>
								{ __( 'Cancel replace', 'jetpack-videopress-pkg' ) }
							</Button>
						) }
						<Button
							variant="primary"
							onClick={ saveTrack }
							isBusy={ isSaving }
							disabled={ isSaving || ! formTrack.tmpFile }
						>
							{ FORM_ACTION_LABELS[ mode ] }
						</Button>
					</div>
				</section>
			</div>
		</Modal>
	) : null;
}
