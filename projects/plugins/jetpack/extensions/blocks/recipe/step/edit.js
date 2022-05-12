/**
 * External dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

function RecipeStepEdit( { className } ) {
	const RECIPE_TEMPLATE = [
		[
			'core/heading',
			{
				level: 5,
				className: 'wp-block-jetpack-recipe-step-name',
			},
		],
		[
			'core/paragraph',
			{
				className: 'wp-block-jetpack-recipe-step-desc',
			},
		],
		[
			'core/image',
			{
				className: 'wp-block-jetpack-recipe-step-image',
			},
		],
	];
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
					template={ RECIPE_TEMPLATE }
				/>
			</div>
		</li>
	);
}

export default RecipeStepEdit;
