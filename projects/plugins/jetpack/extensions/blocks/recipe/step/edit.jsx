/**
 * External dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

function RecipeStepEdit( { className } ) {
	const blockProps = useBlockProps( { className } );
	return (
		<li>
			<div { ...blockProps }>
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
