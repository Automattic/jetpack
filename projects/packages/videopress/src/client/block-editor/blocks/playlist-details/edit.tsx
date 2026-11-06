/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, SelectControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { Stack, SwitchControl } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import { EmptyStateControl, PlaylistPicker } from '../../channel/editor-controls';
import ServerPreview from '../../channel/server-preview';
import { HEADING_LEVEL_OPTIONS } from '../video-details/edit';
/**
 * Types
 */
import type { EmptyStateMode } from '../../channel/editor-controls';
import type { BlockEditProps } from '@wordpress/blocks';

export type PlaylistDetailsAttributes = {
	source: 'queried' | 'index';
	sourcePlaylistId: string;
	showCover: boolean;
	showEyebrow: boolean;
	headingLevel: number;
	showChannel: boolean;
	showMeta: boolean;
	showDescription: boolean;
	showActions: boolean;
	// What an indexed playlist shows while the channel has no playlists.
	emptyState?: EmptyStateMode;
};

/**
 * Playlist Details block edit component.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return Edit component.
 */
export default function PlaylistDetailsEdit( {
	attributes,
	setAttributes,
}: BlockEditProps< PlaylistDetailsAttributes > ) {
	const { source, sourcePlaylistId, headingLevel } = attributes;
	const toggles: Array< [ keyof PlaylistDetailsAttributes, string ] > = [
		[ 'showCover', __( 'Cover', 'jetpack-videopress-pkg' ) ],
		[ 'showEyebrow', __( '“Playlist” label', 'jetpack-videopress-pkg' ) ],
		[ 'showChannel', __( 'Channel name', 'jetpack-videopress-pkg' ) ],
		[ 'showMeta', __( 'Length and last update', 'jetpack-videopress-pkg' ) ],
		[ 'showDescription', __( 'Description', 'jetpack-videopress-pkg' ) ],
		[ 'showActions', __( 'Play all and Share buttons', 'jetpack-videopress-pkg' ) ],
	];

	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<PanelBody title={ __( 'Playlist', 'jetpack-videopress-pkg' ) }>
					<Stack direction="column" gap="md">
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Playlist', 'jetpack-videopress-pkg' ) }
							value={ source }
							options={ [
								{
									value: 'queried',
									label: __( 'The playlist being viewed', 'jetpack-videopress-pkg' ),
								},
								{
									value: 'index',
									label: __( 'A playlist on this site', 'jetpack-videopress-pkg' ),
								},
							] }
							onChange={ value =>
								setAttributes( { source: value as PlaylistDetailsAttributes[ 'source' ] } )
							}
						/>
						{ 'index' === source && (
							<>
								<PlaylistPicker
									value={ sourcePlaylistId }
									onChange={ value => setAttributes( { sourcePlaylistId: value } ) }
								/>
								<EmptyStateControl
									kind="playlists"
									value={ attributes.emptyState }
									onChange={ emptyState => setAttributes( { emptyState } ) }
								/>
							</>
						) }
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Title heading level', 'jetpack-videopress-pkg' ) }
							value={ String( headingLevel ) }
							options={ HEADING_LEVEL_OPTIONS }
							onChange={ value => setAttributes( { headingLevel: Number( value ) } ) }
						/>
						<Stack direction="column" gap="sm">
							{ toggles.map( ( [ key, label ] ) => (
								<SwitchControl
									key={ key }
									label={ label }
									checked={ !! attributes[ key ] }
									onCheckedChange={ checked => setAttributes( { [ key ]: checked } ) }
								/>
							) ) }
						</Stack>
					</Stack>
				</PanelBody>
			</InspectorControls>
			<ServerPreview
				block="videopress/playlist-details"
				attributes={ attributes }
				label={ __( 'Playlist Details', 'jetpack-videopress-pkg' ) }
				emptyInstructions={
					'index' === source
						? __(
								'Publish a Video Playlist with a title to show it here.',
								'jetpack-videopress-pkg'
							)
						: _x(
								'On a playlist page, shows that playlist’s cover, title and details.',
								'',
								'jetpack-videopress-pkg'
							)
				}
			/>
		</div>
	);
}
