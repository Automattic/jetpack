import { Badge, Stack } from '@wordpress/ui';

export const ProductsList = ( { products }: { products: string[] } ) => {
	if ( ! products ) {
		return null;
	}
	return (
		<Stack render={ <ul /> } direction="row" gap="xs" wrap="wrap">
			{ products.map( ( product, index ) => (
				<Badge key={ index } render={ <li /> }>
					{ product }
				</Badge>
			) ) }
		</Stack>
	);
};
