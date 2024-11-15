/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const RecipeStepSave = () => {
	return (
		<li itemProp="step" itemScope itemType="https://schema.org/HowToStep">
			<InnerBlocks.Content />
		</li>
	);
};

export default RecipeStepSave;
