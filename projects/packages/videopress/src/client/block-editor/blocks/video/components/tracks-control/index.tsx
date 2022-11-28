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
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { deleteTrackForGuid } from '../../../../../lib/video-tracks';
import { TrackProps, VideoControlProps, VideoId } from '../../types';
import { captionIcon } from '../icons';
import './style.scss';
import { TrackItemProps, TrackListProps } from './types';
import type React from 'react';

/**
 * Track Item component.
 *
 * @param {TrackItemProps} props       - Component props.
 * @param {TrackProps}     props.track - Video track
 * @param {VideoId}        props.guid  - Video guid
 * @returns {React.ReactElement}         TrackItem react component
 */
function TrackItem( { track, guid }: TrackItemProps ): React.ReactElement {
	const { kind, label } = track;

	const deleteTrackHandler = useCallback( () => {
		deleteTrackForGuid( track, guid );
	}, [] );

	return (
		<div className="videopress-block__track-item">
			<div className="videopress-block__track-item-label">
				{ label }
				<span className="videopress-block__track-item-kind"> ({ kind })</span>
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
			<MenuGroup className="videopress-block-tracks-control__track_list__no-tracks">
				{ __(
					'Tracks can be subtitles, captions, chapters, or descriptions. They help make your content more accessible to a wider range of users.',
					'jetpack-videopress-pkg'
				) }
			</MenuGroup>
		);
	}

	return (
		<MenuGroup
			className="videopress-block-tracks-control__track_list"
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

	// Upload new track handler. ToDo: finish
	const addNewTrackHandler = useCallback( () => {
		console.log( 'adding new track...' ); // eslint-disable-line no-console
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
				return (
					<NavigableMenu>
						<TrackList tracks={ tracks } guid={ guid } />

						<MenuGroup
							label={ __( 'Add tracks', 'jetpack-videopress-pkg' ) }
							className="videopress-block-tracks-control"
						>
							<MenuItem icon={ upload } onClick={ addNewTrackHandler }>
								{ __( 'Upload track', 'jetpack-videopress-pkg' ) }
							</MenuItem>
						</MenuGroup>
					</NavigableMenu>
				);
			} }
		/>
	);
}
