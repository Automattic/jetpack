/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, Placeholder, SelectControl, ToggleControl } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import {
	editorSeries,
	editorSourcePlaylist,
	EmptyStateControl,
	PlaylistPicker,
	SeriesPicker,
} from '../../channel/editor-controls';
import { VideoPressIcon } from '../video/components/icons';
import { PlaylistSettingsPanels, PlaylistStylesControls } from './inspector-controls';
import PlaylistPreview from './preview';
import usePlaylistLiveMetadata from './use-live-metadata';
import usePlaylistId from './use-playlist-id';
import { playlistFontVariables, playlistWrapperClasses } from './utils';
/**
 * Types
 */
import type { PlaylistAttributes, PlaylistEntry, PlaylistSource } from './types';
import type { ChannelPlaylist } from '../../channel/editor-controls';
import type { BlockEditProps } from '@wordpress/blocks';

type Props = Pick< BlockEditProps< PlaylistAttributes >, 'attributes' | 'setAttributes' >;
type SourcedProps = Props & { clientId?: string };

/**
 * Sidebar panel choosing where the playlist's videos come from.
 *
 * @param props               - Component props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return The panel.
 */
export function PlaylistSourcePanel( { attributes, setAttributes }: Props ) {
	const source = attributes.source ?? 'own';
	return (
		<InspectorControls>
			<PanelBody
				title={ __( 'Source', 'jetpack-videopress-pkg' ) }
				initialOpen={ 'own' !== source }
			>
				<SelectControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					label={ __( 'Videos', 'jetpack-videopress-pkg' ) }
					value={ source }
					options={ [
						{ value: 'own', label: __( 'Videos I pick', 'jetpack-videopress-pkg' ) },
						{
							value: 'queried',
							label: __( 'The playlist being viewed', 'jetpack-videopress-pkg' ),
						},
						{ value: 'index', label: __( 'A playlist on this site', 'jetpack-videopress-pkg' ) },
						{ value: 'series', label: __( 'A series', 'jetpack-videopress-pkg' ) },
					] }
					onChange={ value => setAttributes( { source: value as PlaylistSource } ) }
				/>
				{ 'index' === source && (
					<>
						<PlaylistPicker
							value={ attributes.sourcePlaylistId ?? '' }
							onChange={ value => setAttributes( { sourcePlaylistId: value } ) }
						/>
						<EmptyStateControl
							kind="playlists"
							value={ attributes.emptyState }
							onChange={ emptyState => setAttributes( { emptyState } ) }
						/>
					</>
				) }
				{ 'series' === source && (
					<SeriesPicker
						value={ attributes.sourceSeriesId ?? 0 }
						onChange={ value => setAttributes( { sourceSeriesId: value } ) }
					/>
				) }
				{ 'own' !== source && (
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Views and upload date', 'jetpack-videopress-pkg' ) }
						checked={ !! attributes.showMeta }
						onChange={ ( value: boolean ) => setAttributes( { showMeta: value } ) }
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);
}

// Stable, so the live metadata effect does not rerun while there are no videos.
const NO_VIDEOS: PlaylistEntry[] = [];

/**
 * Keeps a series playlist's `playlistId` set: unlike the other sources, it is a playlist of its own in the site's index.
 *
 * @param props               - Component props.
 * @param props.clientId      - This block instance's client id.
 * @param props.playlistId    - The block's current playlist id.
 * @param props.setAttributes - Attribute setter.
 * @return Nothing.
 */
function SeriesPlaylistId( {
	clientId,
	playlistId,
	setAttributes,
}: {
	clientId: string;
	playlistId: string;
	setAttributes: Props[ 'setAttributes' ];
} ) {
	usePlaylistId( { clientId, playlistId, setAttributes } );
	return null;
}

/**
 * The playlist a sourced block previews: its series, or an indexed playlist.
 *
 * @param attributes - Block attributes.
 * @return As editorSourcePlaylist() returns it.
 */
function previewPlaylist( attributes: PlaylistAttributes ): ChannelPlaylist | null | undefined {
	if ( 'series' !== attributes.source ) {
		return editorSourcePlaylist( attributes.sourcePlaylistId ?? '' );
	}
	const series = editorSeries( attributes.sourceSeriesId ?? 0 );
	if ( ! series ) {
		return undefined === series ? undefined : null;
	}
	return { key: '', title: series.name, videos: series.videos };
}

/**
 * Canvas of a playlist that shows another playlist: a preview of that playlist's videos, as the
 * site renders them, with the display settings of this block. The playlist being viewed is only
 * known on the site, so that source keeps a placeholder.
 *
 * @param props               - Component props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @param props.clientId      - This block instance's client id, for a series playlist's ID.
 * @return Edit component.
 */
export function SourcedPlaylistEdit( { attributes, setAttributes, clientId }: SourcedProps ) {
	// The playlist being viewed is only known on the site.
	const isQueried = 'queried' === attributes.source;
	const isSeries = 'series' === attributes.source;
	const playlist = isQueried ? undefined : previewPlaylist( attributes );
	const videos = playlist?.videos?.length ? playlist.videos : NO_VIDEOS;
	const { liveMetadata } = usePlaylistLiveMetadata( videos );
	const [ previewIndex, setPreviewIndex ] = useState( 0 );
	const currentIndex = Math.min( previewIndex, Math.max( 0, videos.length - 1 ) );

	const blockProps = useBlockProps( {
		className: videos.length
			? playlistWrapperClasses( attributes )
			: 'videopress-playlist is-empty',
		style: playlistFontVariables( attributes.entryTitleFontFamily ),
	} );
	const controls = (
		<>
			{ isSeries && clientId && (
				<SeriesPlaylistId
					clientId={ clientId }
					playlistId={ attributes.playlistId ?? '' }
					setAttributes={ setAttributes }
				/>
			) }
			<InspectorControls>
				<PlaylistSettingsPanels attributes={ attributes } setAttributes={ setAttributes } />
			</InspectorControls>
			<PlaylistStylesControls attributes={ attributes } setAttributes={ setAttributes } />
		</>
	);

	if ( ! videos.length ) {
		// Kept as separate statements so the minifier can't merge the __() calls.
		const queriedLabel = __(
			'On a channel playlist or video page, shows the playlist being viewed.',
			'jetpack-videopress-pkg'
		);
		const unknownLabel = __( 'Shows a playlist published on this site.', 'jetpack-videopress-pkg' );
		const noneLabel = __(
			'No playlists yet. Publish a Video Playlist block with a title and it will show up here.',
			'jetpack-videopress-pkg'
		);
		const missingLabel = __(
			'This playlist is no longer published. Pick another one in the block settings.',
			'jetpack-videopress-pkg'
		);
		const emptyLabel = __( 'This playlist has no videos yet.', 'jetpack-videopress-pkg' );
		const seriesLabel = __(
			'Shows a series. Pick one in the block settings.',
			'jetpack-videopress-pkg'
		);
		const seriesMissingLabel = __(
			'This series no longer exists. Pick another one in the block settings.',
			'jetpack-videopress-pkg'
		);
		const seriesEmptyLabel = __(
			'This series has no published videos yet. Videos added to it show up here.',
			'jetpack-videopress-pkg'
		);

		let instructions: string = isQueried ? queriedLabel : unknownLabel;
		if ( isSeries ) {
			instructions = seriesLabel;
			if ( playlist ) {
				instructions = seriesEmptyLabel;
			} else if ( null === playlist && attributes.sourceSeriesId ) {
				instructions = seriesMissingLabel;
			}
		} else if ( null === playlist ) {
			instructions = attributes.sourcePlaylistId ? missingLabel : noneLabel;
		} else if ( playlist ) {
			instructions = emptyLabel;
		}

		return (
			<div { ...blockProps }>
				{ controls }
				<Placeholder
					icon={ VideoPressIcon }
					label={ playlist?.title || __( 'Video Playlist', 'jetpack-videopress-pkg' ) }
					instructions={ instructions }
				/>
			</div>
		);
	}

	return (
		<figure { ...blockProps }>
			{ controls }
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
