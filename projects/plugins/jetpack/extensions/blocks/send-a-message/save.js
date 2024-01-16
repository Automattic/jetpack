import { InnerBlocks } from '@wordpress/block-editor';

export default props => {
	return (
		<div className={ props.className }>
			<InnerBlocks.Content />
		</div>
	);
};
