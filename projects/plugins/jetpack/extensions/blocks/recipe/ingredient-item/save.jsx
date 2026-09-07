/**
 * External dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

const RecipeIngredientItemSave = ( { attributes } ) => {
	const { ingredient } = attributes;
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<RichText.Content tagName="p" itemprop="recipeIngredient" value={ ingredient } />
		</div>
	);
};

export default RecipeIngredientItemSave;
