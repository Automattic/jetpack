/**
 * WordPress dependencies
 */
import {
	store as blockEditorStore,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

const containedBlockName = 'jetpack/recurring-payments-button';

const ALLOWED_BLOCKS = [ containedBlockName ];

const DEFAULT_BLOCK = {
	name: containedBlockName,
};

function RecurringPaymentsEdit() {
	const blockProps = useBlockProps();
	const preferredStyle = useSelect( select => {
		const preferredStyleVariations = select( blockEditorStore ).getSettings()
			.__experimentalPreferredStyleVariations;
		return preferredStyleVariations?.value?.[ containedBlockName ];
	}, [] );

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: ALLOWED_BLOCKS,
		__experimentalDefaultBlock: DEFAULT_BLOCK,
		__experimentalDirectInsert: true,
		template: [
			[ containedBlockName, { className: preferredStyle && `is-style-${ preferredStyle }` } ],
		],
		__experimentalLayout: 'layout',
		templateInsertUpdatesSelection: true,
	} );

	return (
		<>
			<div { ...innerBlocksProps } />
		</>
	);
}

export default RecurringPaymentsEdit;
