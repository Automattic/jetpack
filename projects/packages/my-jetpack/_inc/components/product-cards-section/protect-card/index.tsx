import { useCallback, type FC } from 'react';
import ProductCard from '../../connected-product-card';
import ProtectValueSection from './protect-value-section';

const ProtectCard: FC< { admin: boolean } > = ( { admin } ) => {
	const slug = 'protect';

	// This is a workaround to remove the Description from the product card. However if we end
	// up needing to remove the Description from additional cards in the future, we might consider
	// extending <ProductCard /> functionality to support that.
	const noDescription = useCallback( () => null, [] );

	return (
		<ProductCard
			admin={ admin }
			slug={ slug }
			upgradeInInterstitial={ true }
			Description={ noDescription }
		>
			<ProtectValueSection />
		</ProductCard>
	);
};

export default ProtectCard;
