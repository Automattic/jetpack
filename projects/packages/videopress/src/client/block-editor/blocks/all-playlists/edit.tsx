/**
 * WordPress dependencies
 */
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	PanelBody,
	Placeholder,
	Spinner,
	__experimentalToggleGroupControl as ToggleGroupControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { VideoPressIcon } from '../video/components/icons';
import useRenderedPreview from './use-rendered-preview';
import './editor.scss';
/**
 * Types
 */
import type { AllPlaylistsAttributes, AllPlaylistsLayout } from './types';
import type { BlockEditProps } from '@wordpress/blocks';

/**
 * All Playlists block edit component.
 *
 * The canvas shows the server-rendered block; the sidebar picks the layout.
 *
 * @param props               - Block edit props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return Edit component.
 */
export default function AllPlaylistsEdit( {
	attributes,
	setAttributes,
}: BlockEditProps< AllPlaylistsAttributes > ) {
	const { layout } = attributes;
	const { status, html } = useRenderedPreview( attributes );

	const blockProps = useBlockProps( {
		className: `videopress-all-playlists-editor is-layout-${ layout }`,
	} );

	const inspectorControls = (
		<InspectorControls>
			<PanelBody title={ __( 'Layout', 'jetpack-videopress-pkg' ) }>
				<ToggleGroupControl
					__next40pxDefaultSize
					__nextHasNoMarginBottom
					isBlock
					label={ __( 'Show playlists as', 'jetpack-videopress-pkg' ) }
					value={ layout }
					onChange={ ( value?: string | number ) =>
						setAttributes( {
							layout: value === 'list' ? 'list' : ( 'grid' as AllPlaylistsLayout ),
						} )
					}
				>
					<ToggleGroupControlOption value="grid" label={ __( 'Grid', 'jetpack-videopress-pkg' ) } />
					<ToggleGroupControlOption value="list" label={ __( 'List', 'jetpack-videopress-pkg' ) } />
				</ToggleGroupControl>
			</PanelBody>
		</InspectorControls>
	);

	if ( status !== 'ready' || ! html ) {
		// Kept as separate statements so the minifier can't merge the __() calls.
		const loadingLabel = __( 'Loading playlists…', 'jetpack-videopress-pkg' );
		const errorLabel = __( 'The playlists could not be loaded', 'jetpack-videopress-pkg' );
		const emptyLabel = __( 'No playlists yet', 'jetpack-videopress-pkg' );

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
				'Publish a post or page with a Video Playlist block and it will be listed here.',
				'jetpack-videopress-pkg'
			);
		}

		return (
			<div { ...blockProps }>
				{ inspectorControls }
				<Placeholder icon={ VideoPressIcon } label={ label } instructions={ instructions }>
					{ status === 'loading' && <Spinner /> }
				</Placeholder>
			</div>
		);
	}

	return (
		<div { ...blockProps }>
			{ inspectorControls }
			<RawHTML>{ html }</RawHTML>
		</div>
	);
}
