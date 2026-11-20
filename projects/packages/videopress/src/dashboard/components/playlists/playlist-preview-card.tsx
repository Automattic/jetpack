import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Card, Text } from '@wordpress/ui';
import PlaylistPreview from '../../../client/block-editor/blocks/playlist/preview';
import usePlaylistLiveMetadata from '../../../client/block-editor/blocks/playlist/use-live-metadata';
import { playlistWrapperClasses } from '../../../client/block-editor/blocks/playlist/utils';
import { useFontFamilyPresets } from '../../hooks/use-font-family-presets';
import type { PlaylistEntry, PlaylistSettings } from '../../types/playlists';
import type { CSSProperties } from 'react';

type Props = {
	title: string;
	videos: PlaylistEntry[];
	settings: PlaylistSettings;
};

/**
 * A live preview of the playlist as visitors see it, rendered with the Video
 * Playlist block's own editor preview and front-end stylesheet.
 *
 * @param props          - Component props.
 * @param props.title    - Playlist title.
 * @param props.videos   - Entries.
 * @param props.settings - Display and playback settings.
 * @return The card.
 */
export default function PlaylistPreviewCard( { title, videos, settings }: Props ) {
	const [ selected, setSelected ] = useState( 0 );
	const { liveMetadata } = usePlaylistLiveMetadata( videos );
	const fontFamilies = useFontFamilyPresets();
	const currentIndex = Math.min( selected, Math.max( 0, videos.length - 1 ) );

	// The admin has no preset CSS variables, so the preview uses the font itself.
	const font = fontFamilies.find( preset => preset.slug === settings.entryTitleFontFamily );
	const style = font
		? ( { '--vpp-entry-title-font': font.fontFamily } as CSSProperties )
		: undefined;

	return (
		<Card.Root className="vp-playlist-editor__preview-card">
			<Card.Header>
				<Card.Title>{ __( 'Preview', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				{ videos.length === 0 ? (
					<Text className="vp-playlist-editor__empty">
						{ __( 'Add videos to see a preview.', 'jetpack-videopress-pkg' ) }
					</Text>
				) : (
					<figure
						className={ `${ playlistWrapperClasses( settings ) } vp-playlist-editor__preview` }
						style={ style }
						data-testid="playlist-preview"
					>
						{ settings.showPlaylistTitle && title.trim() !== '' && (
							<div className="videopress-playlist__heading">
								<h2 className="wp-block-heading">{ title }</h2>
							</div>
						) }
						<PlaylistPreview
							videos={ videos }
							attributes={ settings }
							currentIndex={ currentIndex }
							liveMetadata={ liveMetadata }
							onSelect={ setSelected }
						/>
					</figure>
				) }
			</Card.Content>
		</Card.Root>
	);
}
