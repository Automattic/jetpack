import { PRODUCT_SLUGS } from '../../data/constants';
import ProductCard from '../connected-product-card';

const AiCard = props => {
	return <ProductCard slug={ PRODUCT_SLUGS.JETPACK_AI } upgradeInInterstitial { ...props } />;
};

export default AiCard;
