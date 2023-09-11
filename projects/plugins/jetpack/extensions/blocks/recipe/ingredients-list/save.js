/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const RecipeIngredientsListSave = ( { className } ) => {
	return (
		<div className={ className }>
			<InnerBlocks.Content />
		</div>
	);
};

export default RecipeIngredientsListSave;
