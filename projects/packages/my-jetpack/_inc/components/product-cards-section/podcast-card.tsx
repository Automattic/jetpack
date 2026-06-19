import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';
import type { FC } from 'react';

interface PodcastCardProps {
	admin?: boolean;
	recommendation?: boolean;
}

const PodcastCard: FC< PodcastCardProps > = ( { admin, recommendation } ) => {
	return (
		<ProductCard
			slug={ PRODUCT_SLUGS.PODCAST }
			admin={ admin }
			recommendation={ recommendation }
		/>
	);
};

export default PodcastCard;
