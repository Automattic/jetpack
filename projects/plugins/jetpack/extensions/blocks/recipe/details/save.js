const RecipeSave = ( { attributes, className } ) => {
	const { prepTime, cookTime, servings } = attributes;
	return (
		<div className={ className }>
			<div className="wp-block-jetpack-recipe-details__detail">
				<p>Prep Time</p>
				<p>{ prepTime }</p>
			</div>
			<div className="wp-block-jetpack-recipe-details__detail">
				<p>Cook Time</p>
				<p>{ cookTime }</p>
			</div>
			<div className="wp-block-jetpack-recipe-details__detail">
				<p>Servings</p>
				<p>{ servings }</p>
			</div>
		</div>
	);
};

export default RecipeSave;
