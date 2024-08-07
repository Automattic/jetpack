import ProductCard from '../../connected-product-card';
import ProtectValueSection from './protect-value-section';
import type { ProductCardComponent } from '../types';

const ProtectCard: ProductCardComponent = props => {
	const slug = 'protect';

	return (
		<ProductCard { ...props } slug={ slug } upgradeInInterstitial={ true }>
			<ProtectValueSection />
		</ProductCard>
	);
};

export default ProtectCard;
