/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

const RecipeStepsSave = ( { attributes } ) => {
	const { stepHighlightColor, stepTextColor } = attributes;

	const styles = {
		'--step-highlight-color': stepHighlightColor,
		'--step-text-color': stepTextColor,
	};

	return (
		<ol
			style={ styles }
			itemScope=""
			itemProp="recipeInstructions"
			itemType="https://schema.org/HowTo"
		>
			<InnerBlocks.Content />
		</ol>
	);
};

export default RecipeStepsSave;
