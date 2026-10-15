/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, Placeholder, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { PlaylistPicker } from '../../channel/editor-controls';
import { VideoPressIcon } from '../video/components/icons';
import { PlaylistSettingsPanels, PlaylistStylesControls } from './inspector-controls';
/**
 * Types
 */
import type { PlaylistAttributes, PlaylistSource } from './types';
import type { BlockEditProps } from '@wordpress/blocks';

type Props = Pick< BlockEditProps< PlaylistAttributes >, 'attributes' | 'setAttributes' >;

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
						{ value: 'index', label: __( 'A playlist on this site', 'jetpack-videopress-pkg' ) },
					] }
					onChange={ value => setAttributes( { source: value as PlaylistSource } ) }
				/>
				{ 'index' === source && (
					<PlaylistPicker
						value={ attributes.sourcePlaylistId ?? '' }
						onChange={ value => setAttributes( { sourcePlaylistId: value } ) }
					/>
				) }
			</PanelBody>
		</InspectorControls>
	);
}

/**
 * Canvas of a playlist that shows another playlist: the videos are only known on the site.
 *
 * @param props               - Component props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return Edit component.
 */
export function SourcedPlaylistEdit( { attributes, setAttributes }: Props ) {
	return (
		<div { ...useBlockProps() }>
			<InspectorControls>
				<PlaylistSettingsPanels attributes={ attributes } setAttributes={ setAttributes } />
			</InspectorControls>
			<PlaylistStylesControls attributes={ attributes } setAttributes={ setAttributes } />
			<Placeholder
				icon={ VideoPressIcon }
				label={ __( 'Video Playlist', 'jetpack-videopress-pkg' ) }
				instructions={ __( 'Shows a playlist published on this site.', 'jetpack-videopress-pkg' ) }
			/>
		</div>
	);
}
