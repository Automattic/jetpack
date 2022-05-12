/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const RecipeStepsSave = () => {
	return (
		<ol itemscope="" itemprop="recipeInstructions" itemtype="https://schema.org/HowTo">
			<InnerBlocks.Content />
		</ol>
	);
};

export default RecipeStepsSave;
