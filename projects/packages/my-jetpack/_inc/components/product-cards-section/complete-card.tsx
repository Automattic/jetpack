import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';
import type { FC } from 'react';

interface CompleteCardProps {
	admin?: boolean;
	recommendation?: boolean;
}

const CompleteCard: FC< CompleteCardProps > = ( { admin, recommendation } ) => {
	return (
		<ProductCard
			slug={ PRODUCT_SLUGS.COMPLETE }
			showMenu
			admin={ admin }
			recommendation={ recommendation }
		/>
	);
};

export default CompleteCard;
