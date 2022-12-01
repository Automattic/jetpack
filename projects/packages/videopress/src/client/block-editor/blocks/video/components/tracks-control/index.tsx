/**
 * External dependencies
 */
import { MenuItem, MenuGroup, ToolbarDropdownMenu, Button } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { getVideoPressUrl } from '../../../../../lib/url';
import { deleteTrackForGuid, uploadTrackForGuid } from '../../../../../lib/video-tracks';
import { TrackProps, VideoControlProps } from '../../types';
import { tracksIcon } from '../icons';
import './style.scss';
import TrackForm from './track-form';
import { TrackItemProps, TrackListProps } from './types';
import type React from 'react';

/**
 * Track Item component.
 *
 * @param {TrackItemProps} props - Component props.
 * @returns {React.ReactElement}   TrackItem react component
 */
function TrackItem( { track, guid, onDelete }: TrackItemProps ): React.ReactElement {
	const [ isDeleting, setIsDeleting ] = useState( false );
	const { kind, label, srcLang } = track;

	const deleteTrackHandler = () => {
		setIsDeleting( true );
		deleteTrackForGuid( track, guid ).then( () => {
			setIsDeleting( false );
			onDelete?.( track );
		} );
	};

	return (
		<div className={ `video-tracks-control__track-item ${ isDeleting ? 'is-deleting' : '' }` }>
			<div className="video-tracks-control__track-item-label">
				<strong>{ label }</strong>
				<span className="video-tracks-control__track-item-kind">
					{ kind }
					{ srcLang?.length ? ` [${ srcLang }]` : '' }
				</span>
			</div>

			<Button variant="link" isDestructive onClick={ deleteTrackHandler } disabled={ isDeleting }>
				{ __( 'Delete', 'jetpack-videopress-pkg' ) }
			</Button>
		</div>
	);
}

/**
 * Track List React component.
 *
 * @param {TrackListProps} props - Component props.
 * @returns {React.ReactElement}   TracksControl block control
 */
function TrackList( { tracks, guid, onTrackListUpdate }: TrackListProps ): React.ReactElement {
	if ( ! tracks?.length ) {
		return (
			<MenuGroup>
				<div className="video-tracks-control__track_list__no-tracks">
					{ __(
						'Tracks can be subtitles, captions, chapters, or descriptions. They help make your content more accessible to a wider range of users.',
						'jetpack-videopress-pkg'
					) }
				</div>
			</MenuGroup>
		);
	}

	const onDeleteTrackHandler = useCallback(
		( deletedTrack: TrackProps ) => {
			const updatedTrackList = [ ...tracks ].filter( t => t !== deletedTrack );
			onTrackListUpdate( updatedTrackList );
		},
		[ tracks ]
	);

	return (
		<MenuGroup
			className="video-tracks-control__track_list"
			label={ __( 'Text tracks', 'jetpack-videopress-pkg' ) }
		>
			{ tracks.map( ( track: TrackProps, index ) => {
				return (
					<TrackItem
						key={ `${ track.kind }-${ index }` }
						track={ track }
						guid={ guid }
						onDelete={ onDeleteTrackHandler }
					/>
				);
			} ) }
		</MenuGroup>
	);
}

/**
 * Tracks control react component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}      TracksControl block control
 */
export default function TracksControl( {
	attributes,
	setAttributes,
}: VideoControlProps ): React.ReactElement {
	const { tracks, guid } = attributes;

	const [ isUploadingNewTrack, setIsUploadingNewTrack ] = useState( false );
	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;

	const videoPressUrl = getVideoPressUrl( guid, attributes );

	const uploadNewTrackFile = useCallback( newUploadedTrack => {
		uploadTrackForGuid( newUploadedTrack, guid ).then( src => {
			const newTrack = {
				...newUploadedTrack,
				src,
			};
			delete newTrack.tmpFile;

			setAttributes( { tracks: [ ...tracks, newTrack ] } );
			setIsUploadingNewTrack( false );
			invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
		} );
		setIsUploadingNewTrack( true );
	}, [] );

	const onUpdateTrackListHandler = useCallback(
		( updatedTracks: TrackProps[] ) => {
			setAttributes( { tracks: updatedTracks } );
			invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
		},
		[ tracks ]
	);

	return (
		<ToolbarDropdownMenu
			icon={ tracksIcon }
			label={ __( 'Text tracks', 'jetpack-videopress-pkg' ) }
			popoverProps={ {
				variant: 'toolbar',
			} }
		>
			{ () => {
				if ( isUploadingNewTrack ) {
					return (
						<TrackForm
							onCancel={ () => {
								setIsUploadingNewTrack( false );
							} }
							onSave={ uploadNewTrackFile }
							tracks={ tracks }
						/>
					);
				}
				return (
					<>
						<TrackList
							tracks={ tracks }
							guid={ guid }
							onTrackListUpdate={ onUpdateTrackListHandler }
						/>

						<MenuGroup
							label={ __( 'Add tracks', 'jetpack-videopress-pkg' ) }
							className="video-tracks-control"
						>
							<MenuItem icon={ upload } onClick={ () => setIsUploadingNewTrack( true ) }>
								{ __( 'Upload track', 'jetpack-videopress-pkg' ) }
							</MenuItem>
						</MenuGroup>
					</>
				);
			} }
		</ToolbarDropdownMenu>
	);
}
