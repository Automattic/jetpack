/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, RangeControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import ServerSideRender from '@wordpress/server-side-render';
/**
 * Internal dependencies
 */
import './editor.scss';
/**
 * Types
 */
import type { PlaylistsAttributes } from './types';
import type { BlockEditProps } from '@wordpress/blocks';

/**
 * Video Playlists block editor component: a server-rendered preview with the
 * display options in the sidebar.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return The editor element.
 */
export default function PlaylistsEdit( {
	attributes,
	setAttributes,
}: BlockEditProps< PlaylistsAttributes > ) {
	const { limit, showDescription, excludeCurrent, compact } = attributes;
	const blockProps = useBlockProps( { className: 'videopress-playlists-editor' } );

	return (
		<div { ...blockProps }>
			<InspectorControls>
				<PanelBody title={ __( 'Playlists', 'jetpack-videopress-pkg' ) }>
					<RangeControl
						__nextHasNoMarginBottom
						__next40pxDefaultSize
						label={ __( 'Number of playlists', 'jetpack-videopress-pkg' ) }
						help={ __( '0 shows every playlist.', 'jetpack-videopress-pkg' ) }
						value={ limit }
						min={ 0 }
						max={ 24 }
						onChange={ ( value?: number ) => setAttributes( { limit: value ?? 0 } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Show descriptions', 'jetpack-videopress-pkg' ) }
						checked={ showDescription }
						onChange={ ( value: boolean ) => setAttributes( { showDescription: value } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Compact cards', 'jetpack-videopress-pkg' ) }
						help={ __( 'Thumbnail and name only.', 'jetpack-videopress-pkg' ) }
						checked={ compact }
						onChange={ ( value: boolean ) => setAttributes( { compact: value } ) }
					/>
					<ToggleControl
						__nextHasNoMarginBottom
						label={ __( 'Hide the playlist being viewed', 'jetpack-videopress-pkg' ) }
						help={ __( 'On a playlist page, leave that playlist out.', 'jetpack-videopress-pkg' ) }
						checked={ excludeCurrent }
						onChange={ ( value: boolean ) => setAttributes( { excludeCurrent: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<ServerSideRender block="videopress/playlists" attributes={ attributes } />
		</div>
	);
}
