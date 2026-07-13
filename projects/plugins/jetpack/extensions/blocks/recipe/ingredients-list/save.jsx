/**
 * External dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const RecipeIngredientsListSave = () => {
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<InnerBlocks.Content />
		</div>
	);
};

export default RecipeIngredientsListSave;
