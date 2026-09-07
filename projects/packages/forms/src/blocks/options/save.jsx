import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default () => {
	const blockProps = useBlockProps.save();
	const innerBlocksProps = useInnerBlocksProps.save( blockProps );
	return <ul { ...innerBlocksProps } />;
};
