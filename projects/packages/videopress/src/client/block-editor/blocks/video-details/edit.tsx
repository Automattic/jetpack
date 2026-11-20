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
import { EmptyStateControl } from '../../channel/editor-controls';
import ServerPreview from '../../channel/server-preview';
/**
 * Types
 */
import type { EmptyStateMode } from '../../channel/editor-controls';
import type { BlockEditProps } from '@wordpress/blocks';

export type VideoDetailsAttributes = {
	source: 'queried' | 'latest';
	showEyebrow: boolean;
	showTitle: boolean;
	headingLevel: number;
	showMeta: boolean;
	showDescription: boolean;
	showPlaylists: boolean;
	// What the newest-upload source shows while the channel has no videos.
	emptyState?: EmptyStateMode;
};

export const HEADING_LEVEL_OPTIONS = [
	{ value: '0', label: __( 'Automatic', 'jetpack-videopress-pkg' ) },
	...[ 1, 2, 3, 4, 5, 6 ].map( level => ( { value: String( level ), label: `H${ level }` } ) ),
];

/**
 * Video Details block edit component.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return Edit component.
 */
export default function VideoDetailsEdit( {
	attributes,
	setAttributes,
}: BlockEditProps< VideoDetailsAttributes > ) {
	const { source, headingLevel } = attributes;
	const toggles: Array< [ keyof VideoDetailsAttributes, string ] > = [
		[ 'showEyebrow', __( 'Episode number', 'jetpack-videopress-pkg' ) ],
		[ 'showTitle', __( 'Title', 'jetpack-videopress-pkg' ) ],
		[ 'showMeta', __( 'Views and upload date', 'jetpack-videopress-pkg' ) ],
		[ 'showDescription', __( 'Description', 'jetpack-videopress-pkg' ) ],
		[ 'showPlaylists', __( 'Playlists', 'jetpack-videopress-pkg' ) ],
	];

	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<PanelBody title={ __( 'Video', 'jetpack-videopress-pkg' ) }>
					<Stack direction="column" gap="md">
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Video', 'jetpack-videopress-pkg' ) }
							value={ source }
							options={ [
								{
									value: 'queried',
									label: __( 'The video being viewed', 'jetpack-videopress-pkg' ),
								},
								{ value: 'latest', label: __( 'The newest upload', 'jetpack-videopress-pkg' ) },
							] }
							onChange={ value =>
								setAttributes( { source: value as VideoDetailsAttributes[ 'source' ] } )
							}
						/>
						{ 'latest' === source && (
							<EmptyStateControl
								kind="videos"
								value={ attributes.emptyState }
								onChange={ emptyState => setAttributes( { emptyState } ) }
							/>
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
				block="videopress/video-details"
				attributes={ attributes }
				label={ __( 'Video Details', 'jetpack-videopress-pkg' ) }
				emptyInstructions={
					'latest' === source
						? __( 'Upload a VideoPress video to see its details here.', 'jetpack-videopress-pkg' )
						: _x(
								'On a video page, shows that video’s title, views, description and playlists.',
								'',
								'jetpack-videopress-pkg'
							)
				}
			/>
		</div>
	);
}
