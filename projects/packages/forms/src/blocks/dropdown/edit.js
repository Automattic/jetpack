import { InnerBlocks, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

import './editor.scss';

const DEFAULT_BLOCK = {
	name: 'jetpack/dropdown-option',
	attributes: {},
};

const BLOCKS_TEMPLATE = [
	[
		DEFAULT_BLOCK.name,
		{
			...DEFAULT_BLOCK.attributes,
		},
	],
];

export default function DropdownEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-field-dropdown__popover' } );
	const innerBlocksProps = useInnerBlocksProps( blockProps );

	return (
		<div { ...innerBlocksProps }>
			<InnerBlocks
				template={ BLOCKS_TEMPLATE }
				defaultBlock={ DEFAULT_BLOCK }
				directInsert={ true }
				templateLock={ false }
				renderAppender={ InnerBlocks.DefaultBlockAppender }
				__experimentalCaptureToolbars={ true }
			/>
		</div>
	);
}
