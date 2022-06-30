/**
 * External dependencies
 */
import { RichText } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

const name = 'jetpack/recipe-ingredient-item';
function RecipeIngredientItemEdit( {
	className,
	attributes,
	mergeBlocks,
	onReplace,
	onRemove,
	setAttributes,
	clientId,
} ) {
	const { ingredient } = attributes;

	return (
		<div className={ className }>
			<RichText
				tagName="p"
				className="ingredientText"
				value={ ingredient }
				onChange={ val => setAttributes( { ingredient: val } ) }
				onSplit={ ( value, isOriginal ) => {
					let newAttributes;

					if ( isOriginal || value ) {
						newAttributes = {
							...attributes,
							content: value,
						};
					}

					const block = createBlock( name, newAttributes );

					if ( isOriginal ) {
						block.clientId = clientId;
					}

					return block;
				} }
				onMerge={ mergeBlocks }
				onReplace={ onReplace }
				onRemove={ onRemove }
			/>
		</div>
	);
}

export default RecipeIngredientItemEdit;
