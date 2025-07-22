import { InnerBlocks, useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

import './editor.scss';

const DEFAULT_BLOCK = {
	name: 'jetpack/dropdown-option',
};

const TEMPLATE = [ [ DEFAULT_BLOCK.name ] ];

export default function DropdownEdit() {
	const blockProps = useBlockProps( { className: 'jetpack-field-dropdown__popover' } );
	const innerBlocksProps = useInnerBlocksProps( blockProps );

	return (
		<div { ...innerBlocksProps }>
			<InnerBlocks
				__experimentalCaptureToolbars={ true }
				defaultBlock={ DEFAULT_BLOCK }
				directInsert={ true }
				template={ TEMPLATE }
				templateLock={ false }
				templateInsertUpdatesSelection={ true }
			/>
		</div>
	);
}
