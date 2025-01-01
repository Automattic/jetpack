import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';
import type { FC } from 'react';

interface RelatedPostsCardProps {
	admin?: boolean;
	recommendation?: boolean;
}

const RelatedPostsCard: FC< RelatedPostsCardProps > = ( { admin, recommendation } ) => {
	return (
		<ProductCard
			slug={ PRODUCT_SLUGS.RELATED_POSTS }
			admin={ admin }
			recommendation={ recommendation }
		/>
	);
};

export default RelatedPostsCard;
