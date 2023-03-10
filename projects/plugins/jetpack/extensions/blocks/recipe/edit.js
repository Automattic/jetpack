/**
 * External dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

function RecipeEdit( { className } ) {
	const RECIPE_TEMPLATE = [
		[ 'jetpack/recipe-hero' ],
		[
			'core/heading',
			{
				level: 2,
				placeholder: 'Recipe Title',
				className: 'wp-block-jetpack-recipe-title',
			},
		],
		[
			'core/separator',
			{
				color: '--wp--custom--color--foreground',
				className: 'is-style-wide',
				style: 'wide',
			},
		],
		[
			'core/paragraph',
			{
				placeholder: 'Recipe Description',
				className: 'wp-block-jetpack-recipe-description',
			},
		],
		[ 'jetpack/recipe-details', {} ],
		[
			'core/columns',
			{},
			[
				[
					'core/column',
					{
						width: '33.33%',
					},
					[
						[
							'core/heading',
							{
								level: 3,
								content: 'Ingredients',
							},
						],
						[ 'jetpack/recipe-ingredients-list' ],
					],
				],
				[
					'core/column',
					{
						width: '66.66%',
					},
					[
						[
							'core/heading',
							{
								level: 3,
								content: 'Instructions',
							},
						],
						[ 'jetpack/recipe-steps' ],
					],
				],
			],
		],
	];

	return (
		<>
			<div { ...useBlockProps( { className } ) }>
				<InnerBlocks template={ RECIPE_TEMPLATE } />
			</div>
		</>
	);
}

export default RecipeEdit;
