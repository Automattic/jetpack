/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { registerBlockType } from '@wordpress/blocks';
/**
 * Internal dependencies
 */
// Overrides Webpack's publicPath before any lazy chunk loads on wpcom.
import '../../set-webpack-public-path';
import { VideoPressIcon as icon } from '../video/components/icons';
import metadata from './block.json';
import Edit from './edit';
import { PlaylistSourcePanel, SourcedPlaylistEdit } from './source-controls';
/**
 * Types
 */
import type { PlaylistAttributes } from './types';
import type { BlockEditProps } from '@wordpress/blocks';

export const { name, title, description, attributes, category } = metadata;

/**
 * Edit the block's own videos, or configure a playlist that shows another one.
 *
 * @param props - Block edit props.
 * @return Edit component.
 */
function PlaylistBlockEdit( props: BlockEditProps< PlaylistAttributes > ) {
	const isSourced = !! props.attributes.source && 'own' !== props.attributes.source;
	return (
		<>
			<PlaylistSourcePanel attributes={ props.attributes } setAttributes={ props.setAttributes } />
			{ isSourced ? (
				<SourcedPlaylistEdit
					attributes={ props.attributes }
					setAttributes={ props.setAttributes }
				/>
			) : (
				<Edit { ...props } />
			) }
		</>
	);
}

registerBlockType< PlaylistAttributes >( name, {
	edit: PlaylistBlockEdit,
	category,
	title,
	icon,
	// Dynamic block: only the title heading inner block is saved; the rest of
	// the markup is produced by Initializer::render_videopress_playlist_block().
	save: () => <InnerBlocks.Content />,
	attributes,
} );
