import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

const OptionsEdit = () => {
	const blockProps = useBlockProps( { className: 'jetpack-field-multiple__list' } );
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		allowedBlocks: [ `jetpack/option` ],
		defaultBlock: `jetpack/option`,
		template: [ [ `jetpack/option` ] ],
		templateInsertUpdatesSelection: true,
		templateLock: false,
	} );

	return <ul { ...innerBlocksProps } />;
};

export default OptionsEdit;
