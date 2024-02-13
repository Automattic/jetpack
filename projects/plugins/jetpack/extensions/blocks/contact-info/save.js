import { InnerBlocks } from '@wordpress/block-editor';

export default ( { className } ) => (
	<div className={ className }>
		<InnerBlocks.Content />
	</div>
);
