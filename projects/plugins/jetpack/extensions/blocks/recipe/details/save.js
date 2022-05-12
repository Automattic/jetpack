const RecipeSave = ( { attributes, className } ) => {
	const { prepTime, cookTime, servings } = attributes;
	return (
		<div className={ className }>
			<div className="wp-block-jetpack-recipe-details__detail">
				<p>Prep Time</p>
				<p itemprop="prepTime" content={ `PT${ prepTime.toUpperCase() }` }>
					{ prepTime }
				</p>
			</div>
			<div className="wp-block-jetpack-recipe-details__detail">
				<p>Cook Time</p>
				<p itemprop="cookTime" content={ `PT${ cookTime.toUpperCase() }` }>
					{ cookTime }
				</p>
			</div>
			<div className="wp-block-jetpack-recipe-details__detail">
				<p>Servings</p>
				<p itemprop="recipeYield">{ servings }</p>
			</div>
		</div>
	);
};

export default RecipeSave;
