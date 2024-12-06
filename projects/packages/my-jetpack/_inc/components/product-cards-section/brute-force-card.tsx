import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';
import type { FC } from 'react';

interface BruteForceCardProps {
	admin?: boolean;
	recommendation?: boolean;
}

const CompleteCard: FC< BruteForceCardProps > = ( { admin, recommendation } ) => {
	return (
		<ProductCard
			slug={ PRODUCT_SLUGS.BRUTE_FORCE }
			admin={ admin }
			recommendation={ recommendation }
		/>
	);
};

export default CompleteCard;
