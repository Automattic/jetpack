/**
 * WordPress dependencies
 */
import { useBlockEditingMode, useBlockProps } from '@wordpress/block-editor';
import { Placeholder, Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoPressIcon } from '../video/components/icons';
import PlaylistPreview from './preview';
import usePlaylistLiveMetadata from './use-live-metadata';
import { playlistFontVariables, playlistWrapperClasses } from './utils';
/**
 * Types
 */
import type { LatestVideosPlaylistContext } from '../latest-videos-playlist/context';

/**
 * The Video Playlist block as the locked canvas of a Latest Videos Playlist
 * block: it renders the entries and options the parent hands it through
 * block context and offers no editing of its own, so clicks land on the
 * parent, where every setting lives.
 *
 * @param props         - Component props.
 * @param props.context - What the parent block provides.
 * @return Edit component.
 */
export default function LatestVideosInnerPlaylist( {
	context,
}: {
	context: LatestVideosPlaylistContext;
} ) {
	useBlockEditingMode( 'disabled' );

	const { videos, status, attributes } = context;
	const { liveMetadata } = usePlaylistLiveMetadata( videos );
	const [ previewIndex, setPreviewIndex ] = useState( 0 );
	const currentIndex = Math.min( previewIndex, Math.max( 0, videos.length - 1 ) );

	const blockProps = useBlockProps( {
		className: videos.length
			? playlistWrapperClasses( attributes )
			: 'videopress-playlist is-empty',
		style: playlistFontVariables( attributes.entryTitleFontFamily ),
	} );

	if ( status !== 'ready' || ! videos.length ) {
		// Kept as separate statements so the minifier can't merge the __() calls.
		const loadingLabel = __( 'Loading your latest videos…', 'jetpack-videopress-pkg' );
		const errorLabel = __( 'Your latest videos could not be loaded', 'jetpack-videopress-pkg' );
		const emptyLabel = __( 'No VideoPress videos yet', 'jetpack-videopress-pkg' );

		let label: string = emptyLabel;
		if ( status === 'loading' ) {
			label = loadingLabel;
		} else if ( status === 'error' ) {
			label = errorLabel;
		}

		let instructions: string | undefined;
		if ( status === 'error' ) {
			instructions = __( 'Reload the editor to try again.', 'jetpack-videopress-pkg' );
		} else if ( status === 'ready' ) {
			instructions = __(
				'Upload a video to VideoPress and it will show up here.',
				'jetpack-videopress-pkg'
			);
		}

		return (
			<div { ...blockProps }>
				<Placeholder icon={ VideoPressIcon } label={ label } instructions={ instructions }>
					{ status === 'loading' && <Spinner /> }
				</Placeholder>
			</div>
		);
	}

	return (
		<figure { ...blockProps }>
			<PlaylistPreview
				videos={ videos }
				attributes={ attributes }
				currentIndex={ currentIndex }
				liveMetadata={ liveMetadata }
				onSelect={ setPreviewIndex }
			/>
		</figure>
	);
}
