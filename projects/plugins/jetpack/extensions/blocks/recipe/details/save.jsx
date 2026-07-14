/**
 * External dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

const RecipeSave = ( { attributes } ) => {
	const { prepTime, prepTimeLabel, cookTime, cookTimeLabel, servings, servingsLabel } = attributes;
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<div className="wp-block-jetpack-recipe-details__detail">
				<p>{ prepTimeLabel }</p>
				<p itemProp="prepTime" content={ `PT${ prepTime.toUpperCase() }` }>
					{ prepTime }
				</p>
			</div>
			<div className="wp-block-jetpack-recipe-details__detail">
				<p>{ cookTimeLabel }</p>
				<p itemProp="cookTime" content={ `PT${ cookTime.toUpperCase() }` }>
					{ cookTime }
				</p>
			</div>
			<div className="wp-block-jetpack-recipe-details__detail">
				<p>{ servingsLabel }</p>
				<p itemProp="recipeYield">{ servings }</p>
			</div>
			<div className="wp-block-jetpack-recipe-details__detail wp-block-jetpack-recipe-details__detail--print">
				<InnerBlocks.Content />
			</div>
		</div>
	);
};

export default RecipeSave;
