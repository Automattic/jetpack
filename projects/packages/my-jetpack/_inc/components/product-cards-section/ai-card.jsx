import ProductCard from '../connected-product-card';

const AiCard = props => {
	return <ProductCard slug="jetpack-ai" upgradeInInterstitial { ...props } />;
};

export default AiCard;
