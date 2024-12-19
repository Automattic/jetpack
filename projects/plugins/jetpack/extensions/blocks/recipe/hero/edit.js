/**
 * External dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

function RecipeHeroEdit( { className, hasInnerBlocks } ) {
	const blockProps = useBlockProps( { className } );
	return (
		<div { ...blockProps }>
			<InnerBlocks
				allowedBlocks={ [ 'core/image', 'jetpack/slideshow', 'core/cover' ] }
				renderAppender={ ! hasInnerBlocks && InnerBlocks.ButtonBlockAppender }
			/>
		</div>
	);
}

export default RecipeHeroEdit;
