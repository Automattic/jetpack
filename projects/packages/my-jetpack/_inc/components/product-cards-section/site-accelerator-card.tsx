import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';
import type { FC } from 'react';

interface SiteAcceleratorCardProps {
	admin?: boolean;
	recommendation?: boolean;
}

const SiteAcceleratorCard: FC< SiteAcceleratorCardProps > = ( { admin, recommendation } ) => {
	return (
		<ProductCard
			slug={ PRODUCT_SLUGS.SITE_ACCELERATOR }
			admin={ admin }
			recommendation={ recommendation }
		/>
	);
};

export default SiteAcceleratorCard;
