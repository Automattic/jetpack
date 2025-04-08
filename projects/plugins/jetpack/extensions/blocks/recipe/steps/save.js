/**
 * External dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const RecipeStepsSave = ( { attributes } ) => {
	const { stepHighlightColor, stepTextColor } = attributes;
	const blockProps = useBlockProps.save();

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
			{ ...blockProps }
		>
			<InnerBlocks.Content />
		</ol>
	);
};

export default RecipeStepsSave;
