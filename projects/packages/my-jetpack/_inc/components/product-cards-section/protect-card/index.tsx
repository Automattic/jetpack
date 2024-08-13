import { PRODUCT_SLUGS } from '../../../data/constants';
import ProductCard from '../../connected-product-card';
import ProtectValueSection from './protect-value-section';
import type { ProductCardComponent } from '../types';

const ProtectCard: ProductCardComponent = props => (
	<ProductCard { ...props } slug={ PRODUCT_SLUGS.PROTECT } upgradeInInterstitial>
		<ProtectValueSection />
	</ProductCard>
);

export default ProtectCard;
