/**
 * External dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

function RecipeEdit( { className } ) {
	const RECIPE_TEMPLATE = [
		[ 'jetpack/recipe-hero' ],
		[
			'core/heading',
			{
				level: 2,
				placeholder: __( 'Recipe Title', 'jetpack' ),
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
				placeholder: __( 'Recipe Description', 'jetpack' ),
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
								// translators: Ingredients heading for a recipe block.
								content: __( 'Ingredients', 'jetpack' ),
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
								// translators: Instructions heading for a recipe block.
								content: __( 'Instructions', 'jetpack' ),
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
