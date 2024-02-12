import PropTypes from 'prop-types';
import React from 'react';
import ProductCard from '../../connected-product-card';
import BoostSpeedScore from './boost-speed-score';

const BoostCard = ( { admin }: { admin: boolean } ) => {
	return (
		<ProductCard admin={ admin } slug="boost">
			<BoostSpeedScore />
		</ProductCard>
	);
};

BoostCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default BoostCard;
