const RecipeIngredientItemSave = ( { className, attributes } ) => {
	const { ingredient } = attributes;

	return (
		<div className={ className }>
			<p>{ ingredient }</p>
		</div>
	);
};

export default RecipeIngredientItemSave;
