// import { useConnection } from '@automattic/jetpack-connection';
// import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
// import { useRef } from 'react';
// import { PRODUCT_STATUSES } from '../../constants';
import ProductCard from '../connected-product-card';
// import { ExperimentWithAuth } from '@automattic/jetpack-explat';
// import { useExperimentWithAuth } from '@automattic/jetpack-explat';

const AiCard = props => {
	// const { userConnectionData } = useConnection();
	// const { currentUser } = userConnectionData;
	// const { wpcomUser } = currentUser;
	// const userId = currentUser?.id || 0;
	// const blogId = currentUser?.blogId || 0;
	// const wpcomUserId = wpcomUser?.ID || 0;
	// const userOptKey = `jetpack_ai_optfree_${ userId }_${ blogId }_${ wpcomUserId }`;
	// const userOptFree = useRef( localStorage.getItem( userOptKey ) );

	// const userOverrides = {
	// 	[ PRODUCT_STATUSES.CAN_UPGRADE ]: {
	// 		href: '#/jetpack-ai',
	// 		label: __( 'View', 'jetpack-my-jetpack' ),
	// 	},
	// 	[ PRODUCT_STATUSES.NEEDS_PLAN ]: {
	// 		href: '#/jetpack-ai',
	// 	},
	// };

	return (
		<ProductCard
			slug="jetpack-ai"
			// primaryActionOverride={ userOverrides }
			upgradeInInterstitial
			{ ...props }
		/>
	);
};

AiCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default AiCard;
