/**
 * External dependencies
 */
import { RichText } from '@wordpress/block-editor';

const RecipeIngredientItemSave = ( { className, attributes } ) => {
	const { ingredient } = attributes;

	return (
		<div className={ className }>
			<RichText.Content tagName="p" itemprop="recipeIngredient" value={ ingredient } />
		</div>
	);
};

export default RecipeIngredientItemSave;
