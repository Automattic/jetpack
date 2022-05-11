/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

function RecipeHeroEdit( { className, hasInnerBlocks } ) {
	return (
		<div className={ className }>
			<InnerBlocks
				allowedBlocks={ [ 'core/image', 'jetpack/slideshow' ] }
				renderAppender={ ! hasInnerBlocks && InnerBlocks.ButtonBlockAppender }
			/>
		</div>
	);
}

export default RecipeHeroEdit;
