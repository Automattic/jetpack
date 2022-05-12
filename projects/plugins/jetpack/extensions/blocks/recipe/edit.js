/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { InnerBlocks, useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	TextControl,
	__experimentalUnitControl as UnitControl,
} from '@wordpress/components';

function RecipeEdit( { className, attributes, setAttributes } ) {
	const { prepTime, cookTime, servings } = attributes;

	const units = [
		{ value: 'm', label: 'min' },
		{ value: 'h', label: 'hours' },
	];

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
		[
			'jetpack/recipe-details',
			{
				prepTime,
				cookTime,
				servings,
			},
		],
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
			<InspectorControls>
				<PanelBody title={ __( 'Recipe Details', 'jetpack' ) }>
					<UnitControl
						onChange={ val => setAttributes( { prepTime: val } ) }
						onUnitChange={ val => setAttributes( { prepTimeUnit: val } ) }
						label={ __( 'Recipe prep time.', 'jetpack' ) }
						isUnitSelectTabbable
						value={ prepTime }
						units={ units }
					/>
					<br />
					<UnitControl
						onChange={ val => setAttributes( { cookTime: val } ) }
						onUnitChange={ val => {
							setAttributes( { cookTimeUnit: val } );
						} }
						label={ __( 'Recipe cooking time.', 'jetpack' ) }
						isUnitSelectTabbable
						value={ cookTime }
						units={ units }
					/>
					<br />
					<TextControl
						type="number"
						label={ __( 'Number of servings the recipe yields.', 'jetpack' ) }
						value={ servings }
						onChange={ val => setAttributes( { servings: parseInt( val ) } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div { ...useBlockProps( { className } ) }>
				<InnerBlocks template={ RECIPE_TEMPLATE } />
			</div>
		</>
	);
}

export default RecipeEdit;
