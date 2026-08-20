/**
 * External dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const RecipeStepSave = () => {
	const blockProps = useBlockProps.save();

	return (
		<li itemProp="step" itemScope itemType="https://schema.org/HowToStep" { ...blockProps }>
			<InnerBlocks.Content />
		</li>
	);
};

export default RecipeStepSave;
