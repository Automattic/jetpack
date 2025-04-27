import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

import './editor.scss';

function RecipeIngredientsListEdit( { className } ) {
	const blockProps = useBlockProps( { className } );
	return (
		<div { ...blockProps }>
			<InnerBlocks
				allowedBlocks={ [ 'jetpack/recipe-ingredient-item' ] }
				renderAppender={ InnerBlocks.ButtonBlockAppender }
			/>
		</div>
	);
}

export default RecipeIngredientsListEdit;
