const RecipeIngredientItemSave = ( { className, attributes } ) => {
	const { ingredient } = attributes;

	return (
		<div className={ className }>
			<p itemprop="recipeIngredient">{ ingredient }</p>
		</div>
	);
};

export default RecipeIngredientItemSave;
