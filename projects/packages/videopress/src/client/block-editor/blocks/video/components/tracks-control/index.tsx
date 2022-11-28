/**
 * External dependencies
 */
import {
	NavigableMenu,
	MenuItem,
	MenuGroup,
	ToolbarButton,
	Dropdown,
	Button,
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { deleteTrackForGuid, uploadTrackForGuid } from '../../../../../lib/video-tracks';
import { TrackProps, VideoControlProps } from '../../types';
import { captionIcon } from '../icons';
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
function TrackItem( { track, guid }: TrackItemProps ): React.ReactElement {
	const { kind, label } = track;

	const deleteTrackHandler = useCallback( () => {
		deleteTrackForGuid( track, guid );
	}, [] );

	return (
		<div className="video-tracks-control__track-item">
			<div className="video-tracks-control__track-item-label">
				{ label }
				<span className="video-tracks-control__track-item-kind"> ({ kind })</span>
			</div>
			<Button variant="link" isDestructive onClick={ deleteTrackHandler }>
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
function TrackList( { tracks, guid }: TrackListProps ): React.ReactElement {
	if ( ! tracks?.length ) {
		return (
			<MenuGroup className="video-tracks-control__track_list__no-tracks">
				{ __(
					'Tracks can be subtitles, captions, chapters, or descriptions. They help make your content more accessible to a wider range of users.',
					'jetpack-videopress-pkg'
				) }
			</MenuGroup>
		);
	}

	return (
		<MenuGroup
			className="video-tracks-control__track_list"
			label={ __( 'Text tracks', 'jetpack-videopress-pkg' ) }
		>
			{ tracks.map( ( track: TrackProps, index ) => {
				return <TrackItem key={ `${ track.kind }-${ index }` } track={ track } guid={ guid } />;
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
export default function TracksControl( { attributes }: VideoControlProps ): React.ReactElement {
	const { tracks, guid } = attributes;

	const [ isUploadingNewTrack, setIsUploadingNewTrack ] = useState( false );

	const uploadNewTrackFile = useCallback( newTrack => {
		uploadTrackForGuid( newTrack, guid ).then( () => {
			setIsUploadingNewTrack( false );
		} );
		setIsUploadingNewTrack( true );
	}, [] );

	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<ToolbarButton
					label={ __( 'Text tracks', 'jetpack-videopress-pkg' ) }
					showTooltip
					aria-expanded={ isOpen }
					aria-haspopup="true"
					onClick={ onToggle }
					icon={ captionIcon }
				/>
			) }
			renderContent={ () => {
				if ( isUploadingNewTrack ) {
					return (
						<TrackForm
							onCancel={ () => {
								setIsUploadingNewTrack( false );
							} }
							onSave={ uploadNewTrackFile }
						/>
					);
				}
				return (
					<NavigableMenu>
						<TrackList tracks={ tracks } guid={ guid } />

						<MenuGroup
							label={ __( 'Add tracks', 'jetpack-videopress-pkg' ) }
							className="video-tracks-control"
						>
							<MenuItem icon={ upload } onClick={ () => setIsUploadingNewTrack( true ) }>
								{ __( 'Upload track', 'jetpack-videopress-pkg' ) }
							</MenuItem>
						</MenuGroup>
					</NavigableMenu>
				);
			} }
		/>
	);
}
