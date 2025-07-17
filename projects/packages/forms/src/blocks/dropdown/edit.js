import { InnerBlocks, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import './editor.scss';

const DEFAULT_BLOCK = {
	name: 'core/paragraph',
	attributes: { placeholder: __( 'Add option…', 'jetpack-forms' ) },
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
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		__experimentalCaptureToolbars: true,
		defaultBlock: DEFAULT_BLOCK,
		directInsert: true,
		renderAppender: InnerBlocks.DefaultBlockAppender,
		template: BLOCKS_TEMPLATE,
		templateLock: false,
	} );

	return <div { ...innerBlocksProps }>{ innerBlocksProps.children }</div>;
}
