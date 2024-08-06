import { type FC } from 'react';
import ProductCard from '../../connected-product-card';
import ProtectValueSection from './protect-value-section';

const ProtectCard: FC< { admin: boolean; recommendation?: boolean } > = props => {
	const slug = 'protect';

	return (
		<ProductCard { ...props } slug={ slug } upgradeInInterstitial={ true }>
			<ProtectValueSection />
		</ProductCard>
	);
};

export default ProtectCard;
