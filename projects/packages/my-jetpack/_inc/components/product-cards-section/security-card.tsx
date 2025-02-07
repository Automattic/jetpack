import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';
import type { FC } from 'react';

interface SecurityCardProps {
	admin?: boolean;
	recommendation?: boolean;
}

const SecurityCard: FC< SecurityCardProps > = ( { admin, recommendation } ) => {
	return (
		<ProductCard
			slug={ PRODUCT_SLUGS.SECURITY }
			showMenu
			admin={ admin }
			recommendation={ recommendation }
		/>
	);
};

export default SecurityCard;
