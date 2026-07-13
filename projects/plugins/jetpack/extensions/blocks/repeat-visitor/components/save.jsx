import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default () => {
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<div className="wp-block-jetpack-repeat-visitor__inner-container">
				<InnerBlocks.Content />
			</div>
		</div>
	);
};
