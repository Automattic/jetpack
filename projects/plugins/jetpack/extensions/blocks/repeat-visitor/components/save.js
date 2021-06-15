/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

export default ( { className } ) => {
	return (
		<div className={ className }>
			<InnerBlocks.Content />
		</div>
	);
};
