/* @jsxImportSource react */
import { BlockControls, store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, getBlockType, switchToBlockType } from '@wordpress/blocks';
import { DropdownMenu, Toolbar, ToolbarGroup, ToolbarItem } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import type { ComponentProps } from 'react';

type IconType = ComponentProps< typeof DropdownMenu >[ 'icon' ];

// The blocks a comment offers.
const names = [ 'core/paragraph', 'core/list', 'core/quote', 'core/code' ];

// The "+" from @wordpress/icons, a large package for one icon.
const plus = (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<path d="M11 12.5V17.5H12.5V12.5H17.5V11H12.5V6H11V11H6V12.5H11Z" />
	</svg>
);

const menuItem = ( name: string, onClick: () => void ) => {
	const { title, icon } = getBlockType( name )!;

	return { title, icon: ( icon as { src: IconType } ).src, onClick };
};

// The toolbar across the top, for the selected block and its text.
export const BlockToolbar = ( {
	labels,
}: {
	labels: { blockTools: string; addBlock: string };
} ) => {
	const { root, index } = useSelect( select => {
		const { getSelectedBlockClientIds, getBlock, getBlockHierarchyRootClientId, getBlockIndex } =
			select( blockEditorStore );
		const selected = getSelectedBlockClientIds();
		const rootClientId = selected.length ? getBlockHierarchyRootClientId( selected[ 0 ] ) : null;

		return {
			root: rootClientId ? getBlock( rootClientId ) : null,
			index: rootClientId ? getBlockIndex( rootClientId ) : -1,
		};
	}, [] );
	const { replaceBlocks, insertBlock } = useDispatch( blockEditorStore );

	if ( ! root ) {
		return null;
	}

	// Gutenberg's inserter is stubbed out, so "+" offers the same blocks, after the selected one.
	const inserts = names.map( name =>
		menuItem( name, () => insertBlock( createBlock( name ), index + 1 ) )
	);

	// Gutenberg's own switcher is not exported, so the comment offers its four blocks.
	const type = getBlockType( root.name )!;
	const switches = names.flatMap( name => {
		const blocks = name === root.name ? null : switchToBlockType( root, name );

		return blocks ? [ menuItem( name, () => replaceBlocks( root.clientId, blocks ) ) ] : [];
	} );

	return (
		<Toolbar
			label={ labels.blockTools }
			variant="unstyled"
			className="jetpack-comments__block-tools"
		>
			<ToolbarGroup>
				<ToolbarItem>
					{ ( toggleProps: object ) => (
						<DropdownMenu
							toggleProps={ toggleProps }
							icon={ plus }
							label={ labels.addBlock }
							controls={ inserts }
						/>
					) }
				</ToolbarItem>
			</ToolbarGroup>
			<ToolbarGroup>
				<ToolbarItem>
					{ ( toggleProps: object ) => (
						<DropdownMenu
							toggleProps={ toggleProps }
							icon={ ( type.icon as { src: IconType } ).src }
							label={ type.title }
							controls={ switches }
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
