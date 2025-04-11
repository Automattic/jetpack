/**
 * External dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const RecipeHeroSave = () => {
	const blockProps = useBlockProps.save();
	return (
		<div { ...blockProps }>
			<InnerBlocks.Content />
		</div>
	);
};

export default RecipeHeroSave;
