import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { useRef } from 'react';
import { PRODUCT_STATUSES } from '../../constants';
import ProductCard from '../connected-product-card';

const AiCard = ( { admin } ) => {
	const { userConnectionData } = useConnection();
	const { currentUser } = userConnectionData;
	const { wpcomUser } = currentUser;
	const userId = currentUser?.id || 0;
	const blogId = currentUser?.blogId || 0;
	const wpcomUserId = wpcomUser?.ID || 0;
	const userOptKey = `jetpack_ai_optfree_${ userId }_${ blogId }_${ wpcomUserId }`;
	const userOptFree = useRef( localStorage.getItem( userOptKey ) );

	const userOverrides = {
		[ PRODUCT_STATUSES.CAN_UPGRADE ]: {
			href: '#/jetpack-ai',
			label: __( 'View', 'jetpack-my-jetpack' ),
		},
		[ PRODUCT_STATUSES.NEEDS_PURCHASE ]: {
			href: userOptFree.current ? '#/jetpack-ai' : '#/add-jetpack-ai',
		},
	};

	return (
		<ProductCard
			admin={ admin }
			slug="jetpack-ai"
			upgradeInInterstitial={ true }
			primaryActionOverride={ userOverrides }
		/>
	);
};

AiCard.propTypes = {
	admin: PropTypes.bool.isRequired,
};

export default AiCard;
