/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const RecipeStepSave = () => {
	return (
		<li itemprop="step" itemscope itemtype="https://schema.org/HowToStep">
			<InnerBlocks.Content />
		</li>
	);
};

export default RecipeStepSave;
