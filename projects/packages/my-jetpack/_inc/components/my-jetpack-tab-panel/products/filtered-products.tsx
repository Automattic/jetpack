export type FilteredProductsProps = {
	selectedFilter?: string;
	search?: string;
};

/**
 * Render the filtered products component.
 *
 * @param {FilteredProductsProps} props - The component props.
 *
 * @return The rendered component.
 */
export function FilteredProducts( { search, selectedFilter }: FilteredProductsProps ) {
	return (
		<div>
			<p>Selected filter: { selectedFilter }</p>
			<p>Search term: &quot;{ search }&quot;</p>
		</div>
	);
}
