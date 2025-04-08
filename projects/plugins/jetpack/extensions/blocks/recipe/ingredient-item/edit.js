/**
 * External dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

function RecipeIngredientItemEdit( { className, attributes, setAttributes } ) {
	const { ingredient } = attributes;
	const blockProps = useBlockProps( { className } );

	return (
		<div { ...blockProps }>
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
