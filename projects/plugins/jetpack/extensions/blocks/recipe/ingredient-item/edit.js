/**
 * External dependencies
 */
import { TextControl } from '@wordpress/components';

function RecipeIngredientItemEdit( { className, attributes, setAttributes } ) {
	const { ingredient } = attributes;

	return (
		<div className={ className }>
			<TextControl
				className="ingredientText"
				value={ ingredient }
				onChange={ val => setAttributes( { ingredient: val } ) }
			/>
		</div>
	);
}

export default RecipeIngredientItemEdit;
