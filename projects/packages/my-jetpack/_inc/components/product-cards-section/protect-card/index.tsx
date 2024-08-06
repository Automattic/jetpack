import ProductCard from '../../connected-product-card';
import ProtectValueSection from './protect-value-section';
import type { ProductCardType } from '../types';

const ProtectCard: ProductCardType = props => {
	const slug = 'protect';

	return (
		<ProductCard { ...props } slug={ slug } upgradeInInterstitial={ true }>
			<ProtectValueSection />
		</ProductCard>
	);
};

export default ProtectCard;
