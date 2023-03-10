/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

function RecipeStepEdit( { className } ) {
	return (
		<li>
			<div className={ className }>
				<InnerBlocks
					allowedBlocks={ [
						'core/image',
						'core/heading',
						'core/paragraph',
						'core/list',
						'core/button',
					] }
				/>
			</div>
		</li>
	);
}

export default RecipeStepEdit;
