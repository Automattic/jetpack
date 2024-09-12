import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default () => {
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<InnerBlocks.Content />
		</div>
	);
};
