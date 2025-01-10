import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';
import type { FC } from 'react';

interface NewsletterCardProps {
	admin?: boolean;
	recommendation?: boolean;
}

const NewsletterCard: FC< NewsletterCardProps > = ( { admin, recommendation } ) => {
	return (
		<ProductCard
			slug={ PRODUCT_SLUGS.NEWSLETTER }
			admin={ admin }
			recommendation={ recommendation }
		/>
	);
};

export default NewsletterCard;
