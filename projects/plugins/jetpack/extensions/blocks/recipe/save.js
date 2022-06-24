/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const RecipeSave = ( { className } ) => {
	return (
		<div className={ className }>
			<InnerBlocks.Content />
		</div>
	);
};

export default RecipeSave;
