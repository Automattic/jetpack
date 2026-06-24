/**
 * External dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import CaptionManagerModal from '../../../../../components/caption-manager-modal';
import { getVideoPressUrl } from '../../../../../lib/url';
import { tracksIcon } from '../icons';
/**
 * Types
 */
import type { VideoTextTrack } from '../../../../../lib/video-tracks/types';
import type { VideoControlProps } from '../../types';
import type { ReactElement } from 'react';

/**
 * Tracks control react component.
 *
 * @param {VideoControlProps} props - Component props.
 * @return {ReactElement}      TracksControl block control.
 */
export default function TracksControl( {
	attributes,
	setAttributes,
}: VideoControlProps ): ReactElement | null {
	const { guid, poster, title, tracks = [] } = attributes;
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;
	const hasGuid = !! guid;

	const onTracksChange = useCallback(
		( updatedTracks: VideoTextTrack[] ) => {
			if ( ! guid ) {
				return;
			}

			const videoPressUrl = getVideoPressUrl( guid, attributes );
			setAttributes( { tracks: updatedTracks } );
			invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
		},
		[ attributes, guid, invalidateResolution, setAttributes ]
	);

	return (
		<>
			<ToolbarButton
				icon={ tracksIcon }
				label={ __( 'Manage subtitles', 'jetpack-videopress-pkg' ) }
				onClick={ () => setIsModalOpen( true ) }
				disabled={ ! hasGuid }
			/>
			{ hasGuid && (
				<CaptionManagerModal
					isOpen={ isModalOpen }
					guid={ guid }
					title={ title }
					poster={ poster }
					tracks={ tracks }
					onClose={ () => setIsModalOpen( false ) }
					onTracksChange={ onTracksChange }
				/>
			) }
		</>
	);
}
