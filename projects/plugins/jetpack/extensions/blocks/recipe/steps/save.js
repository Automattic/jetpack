/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const RecipeStepsSave = () => {
	return (
		<ol>
			<InnerBlocks.Content />
		</ol>
	);
};

export default RecipeStepsSave;
