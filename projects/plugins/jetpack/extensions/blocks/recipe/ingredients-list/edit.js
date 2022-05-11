/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
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
