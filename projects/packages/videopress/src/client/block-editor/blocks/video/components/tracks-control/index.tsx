/**
 * External dependencies
 */
import { NavigableMenu, MenuItem, MenuGroup, ToolbarButton, Dropdown } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { upload } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { TrackProps, VideoControlProps } from '../../types';
import { captionIcon } from '../icons';
import './style.scss';
import { TrackListProps } from './types';
import type React from 'react';

/**
 * Track Item component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}      TracksControl block control
 */
function TrackItem( { label, kind }: TrackProps ): React.ReactElement {
	return (
		<div className="videopress-block__track-item">
			{ label }
			<span className="videopress-block__track-item-kind"> ({ kind })</span>
		</div>
	);
}

/**
 * Track List React component.
 *
 * @param {VideoControlProps} props - Component props.
 * @returns {React.ReactElement}      TracksControl block control
 */
function TrackList( { tracks }: TrackListProps ): React.ReactElement {
	if ( ! tracks?.length ) {
		return (
			<div className="videopress-block-tracks-control__track_list">
				{ __(
					'Tracks can be subtitles, captions, chapters, or descriptions. They help make your content more accessible to a wider range of users.',
					'jetpack-videopress-pkg'
				) }
			</div>
		);
	}

	return (
		<MenuGroup
			className="videopress-block-tracks-control__track_list"
			label={ __( 'Text tracks', 'jetpack-videopress-pkg' ) }
		>
			{ tracks.map( ( track: TrackProps, index ) => {
				return (
					<TrackItem
						key={ index }
						label={ track.label }
						srcLang={ track.srcLang }
						kind={ track.kind }
						src={ track.src }
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
export default function TracksControl( { attributes }: VideoControlProps ): React.ReactElement {
	const { tracks } = attributes;

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
						<TrackList tracks={ tracks } />

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
