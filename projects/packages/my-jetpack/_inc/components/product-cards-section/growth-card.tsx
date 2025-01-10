import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';
import type { FC } from 'react';

interface GrowthCardProps {
	admin?: boolean;
	recommendation?: boolean;
}

const GrowthCard: FC< GrowthCardProps > = ( { admin, recommendation } ) => {
	return (
		<ProductCard
			slug={ PRODUCT_SLUGS.GROWTH }
			showMenu
			admin={ admin }
			recommendation={ recommendation }
		/>
	);
};

export default GrowthCard;
