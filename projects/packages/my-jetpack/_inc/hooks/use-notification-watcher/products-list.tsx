export const ProductsList = ( { products }: { products: string[] } ) => {
	if ( ! products ) {
		return null;
	}
	return (
		<ul className="products-list">
			{ products.map( ( product, index ) => (
				<li key={ index } className="product-badge">
					{ product }
				</li>
			) ) }
		</ul>
	);
};
