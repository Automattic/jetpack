/* @jsxImportSource react */
import { BlockControls, store as blockEditorStore } from '@wordpress/block-editor';
import { getBlockType, switchToBlockType } from '@wordpress/blocks';
import { DropdownMenu, Toolbar, ToolbarGroup, ToolbarItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import type { ComponentProps } from 'react';

type IconType = ComponentProps< typeof DropdownMenu >[ 'icon' ];

// The toolbar across the top, for the selected block and its text.
export const BlockToolbar = ( { label }: { label: string } ) => {
	const root = useSelect( select => {
		const { getSelectedBlockClientIds, getBlock, getBlockHierarchyRootClientId } =
			select( blockEditorStore );
		const selected = getSelectedBlockClientIds();

		return selected.length ? getBlock( getBlockHierarchyRootClientId( selected[ 0 ] ) ) : null;
	}, [] );
	const { replaceBlocks } = useDispatch( blockEditorStore );

	if ( ! root ) {
		return null;
	}

	// Gutenberg's own switcher is not exported, so the comment offers its four blocks.
	const type = getBlockType( root.name )!;
	const controls = [ 'core/paragraph', 'core/list', 'core/quote', 'core/code' ].flatMap( name => {
		const blocks = name === root.name ? null : switchToBlockType( root, name );
		const target = getBlockType( name )!;

		return blocks
			? [
					{
						title: target.title,
						icon: ( target.icon as { src: IconType } ).src,
						onClick: () => replaceBlocks( root.clientId, blocks ),
					},
				]
			: [];
	} );

	return (
		<Toolbar label={ label } variant="unstyled" className="jetpack-comments__block-tools">
			<ToolbarGroup>
				<ToolbarItem>
					{ ( toggleProps: object ) => (
						<DropdownMenu
							toggleProps={ toggleProps }
							icon={ ( type.icon as { src: IconType } ).src }
							label={ type.title }
							controls={ controls }
						/>
					) }
				</ToolbarItem>
			</ToolbarGroup>
			<BlockControls.Slot group="parent" />
			<BlockControls.Slot group="block" />
			<BlockControls.Slot group="inline" />
			<BlockControls.Slot />
			<BlockControls.Slot group="other" />
		</Toolbar>
	);
};
