import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default () => {
	return (
		<div { ...useBlockProps.save() }>
			<InnerBlocks.Content />
		</div>
	);
};
