/**
 * External dependencies
 */
import { RichText } from '@wordpress/block-editor';

function RecipeIngredientItemEdit( { className, attributes, setAttributes } ) {
	const { ingredient } = attributes;

	return (
		<div className={ className }>
			<RichText
				tagName="p"
				className="ingredientText"
				value={ ingredient }
				onChange={ val => setAttributes( { ingredient: val } ) }
			/>
		</div>
	);
}

export default RecipeIngredientItemEdit;
