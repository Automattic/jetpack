/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import './editor.scss';

function RecipeStepsEdit( { className } ) {
	return (
		<ol className={ className }>
			<InnerBlocks
				allowedBlocks={ [ 'jetpack/recipe-step' ] }
				renderAppender={ InnerBlocks.ButtonBlockAppender }
			/>
		</ol>
	);
}

export default RecipeStepsEdit;
