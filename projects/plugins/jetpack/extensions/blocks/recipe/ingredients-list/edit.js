import { InnerBlocks } from '@wordpress/block-editor';

import './editor.scss';

function RecipeIngredientsListEdit( { className } ) {
	return (
		<div className={ className }>
			<InnerBlocks
				allowedBlocks={ [ 'jetpack/recipe-ingredient-item' ] }
				renderAppender={ InnerBlocks.ButtonBlockAppender }
			/>
		</div>
	);
}

export default RecipeIngredientsListEdit;
